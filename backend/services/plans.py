from datetime import date, datetime, timezone
from typing import Optional

from fastapi import HTTPException
from postgrest.exceptions import APIError
from services.supabase_client import supabase

FREE_LIMITS = {
    "chat": 20,
    "mcq": 1,
}

PRO_LIMITS = {
    "chat": 100,
    "mcq": 10,
}

PRO_STATUSES = {"active", "authenticated", "charged"}
TERMINAL_STATUSES = {"halted", "completed", "expired"}


def _parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None


def get_profile(user_id: str) -> dict:
    try:
        result = supabase.table("profiles").select("*").eq("id", user_id).limit(1).execute()
        if result.data:
            return result.data[0]

        created = (
            supabase.table("profiles")
            .insert(
                {
                    "id": user_id,
                    "plan": "free",
                    "plan_status": "active",
                    "chat_questions_used_today": 0,
                    "mcq_generations_used_today": 0,
                    "usage_reset_date": str(date.today()),
                }
            )
            .execute()
        )
    except APIError as exc:
        raise HTTPException(status_code=500, detail=f"Could not load profile: {exc}") from exc

    if not created.data:
        raise HTTPException(status_code=500, detail="Could not create profile.")
    return created.data[0]


def is_pro(profile: dict) -> bool:
    if profile.get("plan") != "pro":
        return bool(profile.get("is_premium"))

    period_end = _parse_datetime(profile.get("current_period_end"))
    if profile.get("plan_status") in TERMINAL_STATUSES:
        return False
    if period_end:
        return period_end >= datetime.now(timezone.utc)
    if profile.get("plan_status") not in PRO_STATUSES:
        return False
    return True


def limits_for(profile: dict) -> dict:
    return PRO_LIMITS if is_pro(profile) else FREE_LIMITS


def reset_daily_usage_if_needed(user_id: str, profile: dict) -> dict:
    today = str(date.today())
    if str(profile.get("usage_reset_date") or profile.get("last_reset_date")) == today:
        return profile

    updates = {
        "chat_questions_used_today": 0,
        "mcq_generations_used_today": 0,
        "usage_reset_date": today,
        "questions_used_today": 0,
        "last_reset_date": today,
    }

    try:
        result = supabase.table("profiles").update(updates).eq("id", user_id).execute()
    except APIError as exc:
        raise HTTPException(status_code=500, detail=f"Could not reset usage: {exc}") from exc

    return result.data[0] if result.data else {**profile, **updates}


def get_plan_summary(user_id: str) -> dict:
    profile = reset_daily_usage_if_needed(user_id, get_profile(user_id))
    pro = is_pro(profile)
    limits = limits_for(profile)
    chat_used = profile.get("chat_questions_used_today")
    if chat_used is None:
        chat_used = profile.get("questions_used_today") or 0

    return {
        "plan": "pro" if pro else "free",
        "plan_status": profile.get("plan_status") or "active",
        "current_period_end": profile.get("current_period_end"),
        "limits": limits,
        "usage": {
            "chat": chat_used or 0,
            "mcq": profile.get("mcq_generations_used_today") or 0,
        },
        "features": {
            "saved_chats": pro,
            "progress_dashboard": pro,
        },
        "razorpay_subscription_id": profile.get("razorpay_subscription_id") if pro else None,
    }


def require_pro(user_id: str, feature: str) -> dict:
    profile = reset_daily_usage_if_needed(user_id, get_profile(user_id))
    if is_pro(profile):
        return profile
    raise HTTPException(
        status_code=402,
        detail=f"{feature} is available on ParikshAI Pro.",
    )


def consume_quota(user_id: str, quota_type: str) -> dict:
    if quota_type not in {"chat", "mcq"}:
        raise HTTPException(status_code=500, detail="Invalid quota type.")

    profile = reset_daily_usage_if_needed(user_id, get_profile(user_id))
    limits = limits_for(profile)
    column = "chat_questions_used_today" if quota_type == "chat" else "mcq_generations_used_today"
    used = profile.get(column)
    if used is None and quota_type == "chat":
        used = profile.get("questions_used_today") or 0
    used = used or 0

    if used >= limits[quota_type]:
        label = "chat questions" if quota_type == "chat" else "MCQ generations"
        plan_name = "Pro" if is_pro(profile) else "Free"
        raise HTTPException(
            status_code=429,
            detail=f"{plan_name} daily limit reached for {label}. Upgrade or try again tomorrow.",
        )

    updates = {column: used + 1}
    if quota_type == "chat":
        updates["questions_used_today"] = used + 1

    try:
        result = supabase.table("profiles").update(updates).eq("id", user_id).execute()
    except APIError as exc:
        raise HTTPException(status_code=500, detail=f"Could not update usage: {exc}") from exc

    return result.data[0] if result.data else {**profile, **updates}


def mark_pro_subscription(
    user_id: str,
    subscription_id: str,
    status: str = "active",
    current_period_end: Optional[str] = None,
    customer_id: Optional[str] = None,
) -> dict:
    updates = {
        "plan": "pro",
        "plan_status": status,
        "is_premium": True,
        "razorpay_subscription_id": subscription_id,
    }
    if current_period_end:
        updates["current_period_end"] = current_period_end
    if customer_id:
        updates["razorpay_customer_id"] = customer_id

    try:
        result = supabase.table("profiles").update(updates).eq("id", user_id).execute()
    except APIError as exc:
        raise HTTPException(status_code=500, detail=f"Could not update subscription: {exc}") from exc

    return result.data[0] if result.data else get_profile(user_id)


def mark_subscription_status(subscription_id: str, status: str, current_period_end: Optional[str] = None) -> None:
    updates = {"plan_status": status}
    period_end = _parse_datetime(current_period_end)
    entitlement_live = period_end and period_end >= datetime.now(timezone.utc)
    if status in TERMINAL_STATUSES or (status == "cancelled" and not entitlement_live):
        updates["is_premium"] = False
        updates["plan"] = "free"
    elif status == "cancelled" and entitlement_live:
        updates["is_premium"] = True
        updates["plan"] = "pro"
    if current_period_end:
        updates["current_period_end"] = current_period_end

    try:
        (
            supabase.table("profiles")
            .update(updates)
            .eq("razorpay_subscription_id", subscription_id)
            .execute()
        )
    except APIError as exc:
        raise HTTPException(status_code=500, detail=f"Could not update subscription status: {exc}") from exc
