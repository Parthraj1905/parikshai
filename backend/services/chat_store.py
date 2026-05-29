from datetime import datetime, timezone
from typing import Optional

from fastapi import HTTPException
from postgrest.exceptions import APIError
from services.supabase_client import supabase

MAX_CHAT_SESSIONS = 50
MAX_MESSAGES_PER_SESSION = 200
MAX_MESSAGE_CHARS = 12000


def get_user_id_from_auth(authorization: str) -> str:
    token = authorization.replace("Bearer ", "")
    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Unauthorized")
        return user.user.id
    except Exception as exc:
        raise HTTPException(status_code=401, detail="Unauthorized") from exc



def validate_message_content(content: str) -> str:
    cleaned = (content or "").strip()
    if not cleaned:
        raise HTTPException(status_code=400, detail="Message cannot be empty.")
    if len(cleaned) > MAX_MESSAGE_CHARS:
        raise HTTPException(
            status_code=413,
            detail=f"Messages are limited to {MAX_MESSAGE_CHARS:,} characters.",
        )
    return cleaned


def truncate_message_content(content: str) -> str:
    if len(content) <= MAX_MESSAGE_CHARS:
        return content

    suffix = "\n\n[Response truncated to stay within saved chat limits.]"
    return content[: MAX_MESSAGE_CHARS - len(suffix)] + suffix


def _active_sessions_query(user_id: str):
    return (
        supabase.table("chat_sessions")
        .select("*")
        .eq("user_id", user_id)
        .is_("archived_at", "null")
    )


def list_sessions(user_id: str) -> list:
    try:
        result = (
            _active_sessions_query(user_id)
            .order("updated_at", desc=True)
            .limit(MAX_CHAT_SESSIONS)
            .execute()
        )
    except APIError as exc:
        raise HTTPException(status_code=500, detail=f"Could not load chats: {exc}") from exc
    return result.data or []


def get_session(user_id: str, session_id: str) -> dict:
    try:
        result = (
            _active_sessions_query(user_id)
            .eq("id", session_id)
            .limit(1)
            .execute()
        )
    except APIError as exc:
        raise HTTPException(status_code=500, detail=f"Could not load chat: {exc}") from exc

    if not result.data:
        raise HTTPException(status_code=404, detail="Chat not found.")
    return result.data[0]


def load_messages(user_id: str, session_id: str) -> list:
    get_session(user_id, session_id)
    try:
        result = (
            supabase.table("chat_messages")
            .select("id,session_id,user_id,role,content,created_at")
            .eq("user_id", user_id)
            .eq("session_id", session_id)
            .order("created_at")
            .limit(MAX_MESSAGES_PER_SESSION)
            .execute()
        )
    except APIError as exc:
        raise HTTPException(status_code=500, detail=f"Could not load messages: {exc}") from exc
    return result.data or []


def _archive_oldest_if_needed(user_id: str) -> None:
    try:
        result = (
            _active_sessions_query(user_id)
            .order("updated_at")
            .limit(MAX_CHAT_SESSIONS)
            .execute()
        )
    except APIError as exc:
        raise HTTPException(status_code=500, detail=f"Could not check chat limit: {exc}") from exc

    sessions = result.data or []
    if len(sessions) < MAX_CHAT_SESSIONS:
        return

    archive_ids = [row["id"] for row in sessions[: len(sessions) - MAX_CHAT_SESSIONS + 1]]
    try:
        (
            supabase.table("chat_sessions")
            .delete()
            .in_("id", archive_ids)
            .eq("user_id", user_id)
            .execute()
        )
    except APIError as exc:
        raise HTTPException(status_code=500, detail=f"Could not remove old chats: {exc}") from exc


def make_title(content: str) -> str:
    title = " ".join(content.strip().split())
    if not title:
        return "New chat"
    return title[:57] + "..." if len(title) > 60 else title


def create_session(user_id: str, exam: str, language: str, title: Optional[str] = None) -> dict:
    _archive_oldest_if_needed(user_id)
    payload = {
        "user_id": user_id,
        "title": title or "New chat",
        "exam": exam,
        "language": language,
    }
    try:
        result = supabase.table("chat_sessions").insert(payload).execute()
    except APIError as exc:
        raise HTTPException(status_code=500, detail=f"Could not create chat: {exc}") from exc

    if not result.data:
        raise HTTPException(status_code=500, detail="Could not create chat.")
    return result.data[0]


def update_session(user_id: str, session_id: str, title: Optional[str] = None) -> dict:
    get_session(user_id, session_id)
    payload = {}
    if title is not None:
        cleaned_title = " ".join(title.strip().split())
        payload["title"] = cleaned_title[:60] or "New chat"
    if not payload:
        return get_session(user_id, session_id)

    try:
        result = (
            supabase.table("chat_sessions")
            .update(payload)
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )
    except APIError as exc:
        raise HTTPException(status_code=500, detail=f"Could not update chat: {exc}") from exc

    if not result.data:
        raise HTTPException(status_code=404, detail="Chat not found.")
    return result.data[0]


def archive_session(user_id: str, session_id: str) -> None:
    get_session(user_id, session_id)
    try:
        (
            supabase.table("chat_sessions")
            .delete()
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )
    except APIError as exc:
        raise HTTPException(status_code=500, detail=f"Could not delete chat: {exc}") from exc


def message_count(user_id: str, session_id: str) -> int:
    messages = load_messages(user_id, session_id)
    return len(messages)


def ensure_message_room(user_id: str, session_id: str, incoming_count: int = 2) -> None:
    if message_count(user_id, session_id) + incoming_count > MAX_MESSAGES_PER_SESSION:
        raise HTTPException(
            status_code=409,
            detail=f"This chat has reached the {MAX_MESSAGES_PER_SESSION} message limit. Start a new chat to continue.",
        )


def append_message(user_id: str, session_id: str, role: str, content: str) -> dict:
    if role not in {"user", "model"}:
        raise HTTPException(status_code=400, detail="Invalid message role.")

    saved_content = validate_message_content(content) if role == "user" else truncate_message_content(content)
    payload = {
        "session_id": session_id,
        "user_id": user_id,
        "role": role,
        "content": saved_content,
    }
    try:
        result = supabase.table("chat_messages").insert(payload).execute()
        (
            supabase.table("chat_sessions")
            .update({"updated_at": datetime.now(timezone.utc).isoformat()})
            .eq("id", session_id)
            .eq("user_id", user_id)
            .execute()
        )
    except APIError as exc:
        raise HTTPException(status_code=500, detail=f"Could not save message: {exc}") from exc

    if not result.data:
        raise HTTPException(status_code=500, detail="Could not save message.")
    return result.data[0]
