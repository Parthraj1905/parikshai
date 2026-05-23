from typing import Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from services.gemini import GeminiServiceError, get_ai_response
from services.chat_store import (
    append_message,
    create_session,
    ensure_message_room,
    get_session,
    get_user_id_from_auth,
    make_title,
    validate_message_content,
)
from services.supabase_client import supabase

router = APIRouter()

class ChatRequest(BaseModel):
    exam: str
    language: str
    messages: list
    session_id: Optional[str] = None

@router.post("/chat")
async def chat(req: ChatRequest, authorization: str = Header(...)):
    user_id = get_user_id_from_auth(authorization)
    if not req.messages:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")

    latest_message = req.messages[-1] or {}
    user_message = validate_message_content(latest_message.get("content", ""))
    
    # Check daily limit for free users
    profile = supabase.table("profiles").select("*").eq("id", user_id).single().execute()
    p = profile.data
    
    from datetime import date
    today = str(date.today())
    
    if not p["is_premium"]:
        if p["last_reset_date"] != today:
            supabase.table("profiles").update({
                "questions_used_today": 0,
                "last_reset_date": today
            }).eq("id", user_id).execute()
            p["questions_used_today"] = 0
        
        if p["questions_used_today"] >= 20:
            raise HTTPException(status_code=429, detail="Daily limit reached. Upgrade to premium.")
    
    if req.session_id:
        session = get_session(user_id, req.session_id)
        session_id = session["id"]
        ensure_message_room(user_id, session_id, incoming_count=2)
    else:
        session = create_session(user_id, req.exam, req.language, make_title(user_message))
        session_id = session["id"]

    append_message(user_id, session_id, "user", user_message)

    try:
        ai_reply = await get_ai_response(req.exam, req.language, req.messages)
    except GeminiServiceError as exc:
        headers = {}
        if exc.retry_after:
            headers["Retry-After"] = str(exc.retry_after)
        raise HTTPException(
            status_code=exc.status_code,
            detail=exc.message,
            headers=headers or None,
        ) from exc

    saved_reply = append_message(user_id, session_id, "model", ai_reply)
    
    # Increment counter
    supabase.table("profiles").update({
        "questions_used_today": p["questions_used_today"] + 1
    }).eq("id", user_id).execute()
    
    return {
        "reply": saved_reply["content"],
        "session_id": session_id,
    }
