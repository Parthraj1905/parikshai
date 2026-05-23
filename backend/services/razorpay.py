import hashlib
import hmac
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import HTTPException
from postgrest.exceptions import APIError

from config import (
    RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET,
    RAZORPAY_PRO_MONTHLY_PLAN_ID,
    RAZORPAY_WEBHOOK_SECRET,
)
from services.supabase_client import supabase

RAZORPAY_API = "https://api.razorpay.com/v1"


def require_razorpay_config(require_plan: bool = False) -> None:
    required = {
        "RAZORPAY_KEY_ID": RAZORPAY_KEY_ID,
        "RAZORPAY_KEY_SECRET": RAZORPAY_KEY_SECRET,
    }
    if require_plan:
        required["RAZORPAY_PRO_MONTHLY_PLAN_ID"] = RAZORPAY_PRO_MONTHLY_PLAN_ID

    missing = [name for name, value in required.items() if not value]
    if missing:
        raise HTTPException(status_code=500, detail=f"Missing Razorpay config: {', '.join(missing)}")


def epoch_to_iso(value: Optional[int]) -> Optional[str]:
    if not value:
        return None
    return datetime.fromtimestamp(value, tz=timezone.utc).isoformat()


def verify_hmac(message: str, signature: str, secret: str) -> bool:
    expected = hmac.new(secret.encode(), message.encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature or "")


def verify_checkout_signature(subscription_id: str, payment_id: str, signature: str) -> bool:
    if not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Missing Razorpay key secret.")
    return verify_hmac(f"{subscription_id}|{payment_id}", signature, RAZORPAY_KEY_SECRET)


def verify_order_signature(order_id: str, payment_id: str, signature: str) -> bool:
    if not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Missing Razorpay key secret.")
    return verify_hmac(f"{order_id}|{payment_id}", signature, RAZORPAY_KEY_SECRET)


def verify_webhook_signature(raw_body: bytes, signature: str) -> bool:
    if not RAZORPAY_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Missing Razorpay webhook secret.")
    expected = hmac.new(RAZORPAY_WEBHOOK_SECRET.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature or "")


async def _razorpay_request(method: str, path: str, payload: Optional[dict] = None) -> dict:
    require_razorpay_config()
    async with httpx.AsyncClient(timeout=20) as client:
        response = await client.request(
            method,
            f"{RAZORPAY_API}{path}",
            auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET),
            json=payload,
        )

    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"Razorpay error: {response.text}")
    return response.json()


import urllib.parse

async def create_customer(email: str, name: str, user_id: str) -> dict:
    try:
        return await _razorpay_request(
            "POST",
            "/customers",
            {
                "name": name or email,
                "email": email,
                "notes": {"user_id": user_id},
            },
        )
    except HTTPException as exc:
        if "Customer already exists" in str(exc.detail):
            # Fetch existing customer
            safe_email = urllib.parse.quote(email)
            response = await _razorpay_request("GET", f"/customers?email={safe_email}")
            items = response.get("items", [])
            if items:
                return items[0]
        raise exc


async def create_subscription(user_id: str, email: str, name: str, customer_id: Optional[str] = None) -> dict:
    require_razorpay_config(require_plan=True)
    if not customer_id:
        customer = await create_customer(email, name, user_id)
        customer_id = customer.get("id")

    subscription = await _razorpay_request(
        "POST",
        "/subscriptions",
        {
            "plan_id": RAZORPAY_PRO_MONTHLY_PLAN_ID,
            "total_count": 120,
            "quantity": 1,
            "customer_notify": 0,
            "customer_id": customer_id,
            "notes": {"user_id": user_id, "plan": "pro_monthly"},
        },
    )
    subscription["customer_id"] = customer_id
    return subscription


async def create_order(amount_paise: int, currency: str, receipt: str, notes: Optional[dict] = None) -> dict:
    return await _razorpay_request(
        "POST",
        "/orders",
        {
            "amount": amount_paise,
            "currency": currency,
            "receipt": receipt,
            "notes": notes or {},
        },
    )


async def fetch_subscription(subscription_id: str) -> dict:
    return await _razorpay_request("GET", f"/subscriptions/{subscription_id}")


def record_billing_event(event_id: str, event_type: str, payload: dict) -> bool:
    try:
        result = (
            supabase.table("billing_events")
            .insert(
                {
                    "razorpay_event_id": event_id,
                    "event_type": event_type,
                    "payload": payload,
                }
            )
            .execute()
        )
    except APIError as exc:
        if "duplicate" in str(exc).lower() or "unique" in str(exc).lower():
            return False
        raise HTTPException(status_code=500, detail=f"Could not record billing event: {exc}") from exc
    return bool(result.data)


def record_payment(user_id: Optional[str], payment: dict, subscription_id: Optional[str]) -> None:
    payment_id = payment.get("id")
    if not payment_id:
        return

    payload = {
        "user_id": user_id,
        "razorpay_payment_id": payment_id,
        "razorpay_subscription_id": subscription_id or payment.get("subscription_id"),
        "razorpay_invoice_id": payment.get("invoice_id"),
        "amount": payment.get("amount"),
        "currency": payment.get("currency"),
        "status": payment.get("status"),
        "payload": payment,
    }
    try:
        supabase.table("billing_payments").upsert(payload, on_conflict="razorpay_payment_id").execute()
    except APIError as exc:
        raise HTTPException(status_code=500, detail=f"Could not record payment: {exc}") from exc


def find_user_id_for_subscription(subscription: dict) -> Optional[str]:
    notes = subscription.get("notes") or {}
    if notes.get("user_id"):
        return notes["user_id"]

    subscription_id = subscription.get("id")
    if not subscription_id:
        return None

    result = (
        supabase.table("profiles")
        .select("id")
        .eq("razorpay_subscription_id", subscription_id)
        .limit(1)
        .execute()
    )
    return result.data[0]["id"] if result.data else None
