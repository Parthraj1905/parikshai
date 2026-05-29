import json
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Request
from pydantic import BaseModel

from config import RAZORPAY_KEY_ID
from services.plans import (
    get_plan_summary,
    get_profile,
    mark_pro_subscription,
    mark_subscription_status,
)
from services.razorpay import (
    create_subscription,
    epoch_to_iso,
    fetch_subscription,
    find_user_id_for_subscription,
    record_billing_event,
    record_payment,
    verify_checkout_signature,
    verify_webhook_signature,
)
from services.supabase_client import supabase

router = APIRouter()


class VerifySubscriptionRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_subscription_id: str
    razorpay_signature: str


def _get_user(authorization: str):
    token = authorization.replace("Bearer ", "")
    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        return user.user
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Unauthorized") from exc



@router.get("/me/plan")
async def me_plan(authorization: str = Header(...)):
    user = _get_user(authorization)
    return get_plan_summary(user.id)


@router.post("/billing/subscription")
async def billing_subscription(authorization: str = Header(...)):
    user = _get_user(authorization)
    profile = get_profile(user.id)
    existing_subscription_id = profile.get("razorpay_subscription_id")

    if existing_subscription_id:
        if profile.get("plan_status") in {"authenticated", "active"}:
            try:
                # Verify the subscription exists in the current environment and is not cancelled
                sub = await fetch_subscription(existing_subscription_id)
                if sub.get("status") in {"authenticated", "active"}:
                    subscription = {"id": existing_subscription_id}
                else:
                    existing_subscription_id = None
            except Exception:
                existing_subscription_id = None
        else:
            existing_subscription_id = None

    if not existing_subscription_id:
        try:
            subscription = await create_subscription(
                user.id,
                user.email or "",
                (user.email or "").split("@")[0],
                profile.get("razorpay_customer_id"),
            )
        except Exception:
            # If customer ID is from another environment, clear it and try again
            subscription = await create_subscription(
                user.id,
                user.email or "",
                (user.email or "").split("@")[0],
                None,
            )

        updates = {
            "plan": "pro",
            "plan_status": subscription.get("status") or "created",
            "razorpay_subscription_id": subscription["id"],
            "razorpay_customer_id": subscription.get("customer_id") or profile.get("razorpay_customer_id"),
        }
        supabase.table("profiles").update(updates).eq("id", user.id).execute()

    return {
        "key_id": RAZORPAY_KEY_ID,
        "subscription_id": subscription["id"],
        "name": "ParikshAI Pro",
        "description": "Pro monthly subscription",
        "prefill": {"email": user.email, "contact": "9999999999"},
    }


@router.post("/billing/verify")
async def billing_verify(req: VerifySubscriptionRequest, authorization: str = Header(...)):
    user = _get_user(authorization)
    profile = get_profile(user.id)

    if profile.get("razorpay_subscription_id") != req.razorpay_subscription_id:
        raise HTTPException(status_code=403, detail="Subscription does not belong to this account.")

    if not verify_checkout_signature(
        req.razorpay_subscription_id,
        req.razorpay_payment_id,
        req.razorpay_signature,
    ):
        raise HTTPException(status_code=400, detail="Invalid Razorpay signature.")

    subscription = await fetch_subscription(req.razorpay_subscription_id)
    mark_pro_subscription(
        user.id,
        req.razorpay_subscription_id,
        status="active",
        current_period_end=epoch_to_iso(subscription.get("current_end")),
        customer_id=subscription.get("customer_id") or profile.get("razorpay_customer_id"),
    )
    record_payment(
        user.id,
        {
            "id": req.razorpay_payment_id,
            "subscription_id": req.razorpay_subscription_id,
            "status": "authorized",
            "currency": "INR",
        },
        req.razorpay_subscription_id,
    )
    return get_plan_summary(user.id)


def _subscription_from_payload(payload: dict) -> dict:
    return (((payload.get("payload") or {}).get("subscription") or {}).get("entity") or {})


def _payment_from_payload(payload: dict) -> dict:
    return (((payload.get("payload") or {}).get("payment") or {}).get("entity") or {})


def _period_end(subscription: dict, payment: dict) -> Optional[str]:
    return epoch_to_iso(
        subscription.get("current_end")
        or subscription.get("ended_at")
        or payment.get("created_at")
    )


@router.post("/billing/webhook")
async def billing_webhook(request: Request, x_razorpay_signature: str = Header(default="")):
    raw_body = await request.body()
    if not verify_webhook_signature(raw_body, x_razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature.")

    payload = json.loads(raw_body.decode("utf-8"))
    event_type = payload.get("event") or "unknown"
    event_id = request.headers.get("x-razorpay-event-id") or payload.get("id")
    if not event_id:
        raise HTTPException(status_code=400, detail="Missing Razorpay event id.")

    if not record_billing_event(event_id, event_type, payload):
        return {"ok": True, "duplicate": True}

    subscription = _subscription_from_payload(payload)
    payment = _payment_from_payload(payload)
    subscription_id = subscription.get("id") or payment.get("subscription_id")
    user_id = find_user_id_for_subscription(subscription) if subscription else None

    if payment:
        record_payment(user_id, payment, subscription_id)

    if not subscription_id:
        return {"ok": True}

    if not user_id and subscription_id:
        result = (
            supabase.table("profiles")
            .select("id")
            .eq("razorpay_subscription_id", subscription_id)
            .limit(1)
            .execute()
        )
        user_id = result.data[0]["id"] if result.data else None

    if event_type in {"subscription.activated", "subscription.authenticated", "subscription.charged"} and user_id:
        mark_pro_subscription(
            user_id,
            subscription_id,
            status="active",
            current_period_end=_period_end(subscription, payment),
            customer_id=subscription.get("customer_id"),
        )
    elif event_type in {"payment.captured", "invoice.paid"} and user_id:
        mark_pro_subscription(
            user_id,
            subscription_id,
            status="active",
            current_period_end=_period_end(subscription, payment),
            customer_id=subscription.get("customer_id"),
        )
    elif event_type in {"subscription.cancelled", "subscription.halted", "subscription.completed"}:
        mark_subscription_status(
            subscription_id,
            subscription.get("status") or event_type.split(".")[-1],
            current_period_end=_period_end(subscription, payment),
        )

    return {"ok": True}
