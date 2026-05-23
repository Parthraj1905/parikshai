from typing import Optional

from fastapi import APIRouter, Header
from pydantic import BaseModel
from services.chat_store import (
    archive_session,
    create_session,
    get_session,
    get_user_id_from_auth,
    list_sessions,
    load_messages,
    update_session,
)
from services.plans import require_pro

router = APIRouter()


class CreateChatRequest(BaseModel):
    exam: str
    language: str
    title: Optional[str] = None


class UpdateChatRequest(BaseModel):
    title: Optional[str] = None


@router.get("/chats")
async def chats(authorization: str = Header(...)):
    user_id = get_user_id_from_auth(authorization)
    require_pro(user_id, "Saved chats")
    return {"chats": list_sessions(user_id)}


@router.get("/chats/{session_id}")
async def chat_detail(session_id: str, authorization: str = Header(...)):
    user_id = get_user_id_from_auth(authorization)
    require_pro(user_id, "Saved chats")
    session = get_session(user_id, session_id)
    messages = load_messages(user_id, session_id)
    return {"chat": session, "messages": messages}


@router.post("/chats")
async def create_chat(req: CreateChatRequest, authorization: str = Header(...)):
    user_id = get_user_id_from_auth(authorization)
    require_pro(user_id, "Saved chats")
    return {"chat": create_session(user_id, req.exam, req.language, req.title)}


@router.patch("/chats/{session_id}")
async def update_chat(session_id: str, req: UpdateChatRequest, authorization: str = Header(...)):
    user_id = get_user_id_from_auth(authorization)
    require_pro(user_id, "Saved chats")
    return {"chat": update_session(user_id, session_id, req.title)}


@router.delete("/chats/{session_id}")
async def delete_chat(session_id: str, authorization: str = Header(...)):
    user_id = get_user_id_from_auth(authorization)
    require_pro(user_id, "Saved chats")
    archive_session(user_id, session_id)
    return {"ok": True}
