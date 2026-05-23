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
from services.plans import consume_quota, is_pro

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

    profile = consume_quota(user_id, "chat")
    should_save = is_pro(profile)

    if req.session_id and should_save:
        session = get_session(user_id, req.session_id)
        session_id = session["id"]
        ensure_message_room(user_id, session_id, incoming_count=2)
    elif should_save:
        session = create_session(user_id, req.exam, req.language, make_title(user_message))
        session_id = session["id"]
    else:
        session_id = None

    if should_save:
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

    if should_save:
        saved_reply = append_message(user_id, session_id, "model", ai_reply)
        ai_reply = saved_reply["content"]
    
    return {
        "reply": ai_reply,
        "session_id": session_id,
    }
