from typing import Optional
import re

from fastapi import APIRouter, Header, HTTPException
from postgrest.exceptions import APIError
from pydantic import BaseModel
from services.gemini import GeminiServiceError, generate_mcq, generate_mcqs
from services.supabase_client import supabase

router = APIRouter()


class GenerateMCQRequest(BaseModel):
    exam: str
    language: str
    topic: Optional[str] = None
    count: int = 1


class SubmitMCQRequest(BaseModel):
    user_id: str
    question_id: str
    selected_answer: str
    correct_answer: str
    exam: str
    topic: Optional[str] = None


def _get_user_id(authorization: str) -> str:
    token = authorization.replace("Bearer ", "")
    user = supabase.auth.get_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return user.user.id


def _raise_ai_http_error(exc: GeminiServiceError) -> None:
    headers = {}
    if exc.retry_after:
        headers["Retry-After"] = str(exc.retry_after)
    raise HTTPException(
        status_code=exc.status_code,
        detail=exc.message,
        headers=headers or None,
    ) from exc


def _missing_column(exc: APIError) -> Optional[str]:
    match = re.search(r"Could not find the '([^']+)' column", str(exc))
    return match.group(1) if match else None


def _insert_with_available_columns(table: str, payload: dict, required_columns: set) -> None:
    data = dict(payload)
    while True:
        try:
            supabase.table(table).insert(data).execute()
            return
        except APIError as exc:
            column = _missing_column(exc)
            if not column or column in required_columns or column not in data:
                raise
            data.pop(column)


def _increment_weak_topic(user_id: str, exam: str, topic: str) -> None:
    existing = (
        supabase.table("weak_topics")
        .select("*")
        .eq("user_id", user_id)
        .eq("exam", exam)
        .eq("topic", topic)
        .limit(1)
        .execute()
    )

    if existing.data:
        row = existing.data[0]
        wrong_count = (row.get("wrong_count") or 0) + 1
        query = supabase.table("weak_topics").update({"wrong_count": wrong_count})
        if row.get("id"):
            query = query.eq("id", row["id"])
        else:
            query = query.eq("user_id", user_id).eq("exam", exam).eq("topic", topic)
        query.execute()
        return

    _insert_with_available_columns(
        "weak_topics",
        {
            "user_id": user_id,
            "exam": exam,
            "topic": topic,
            "wrong_count": 1,
        },
        {"user_id", "topic", "wrong_count"},
    )


@router.post("/mcq/generate")
async def generate(req: GenerateMCQRequest, authorization: str = Header(...)):
    _get_user_id(authorization)

    try:
        if req.count > 1:
            return {"questions": await generate_mcqs(req.exam, req.language, req.topic, req.count)}
        return await generate_mcq(req.exam, req.language, req.topic)
    except GeminiServiceError as exc:
        _raise_ai_http_error(exc)


@router.post("/mcq/submit")
async def submit(req: SubmitMCQRequest, authorization: str = Header(...)):
    user_id = _get_user_id(authorization)
    if req.user_id != user_id:
        raise HTTPException(status_code=403, detail="Cannot submit progress for another user.")

    topic = req.topic.strip() if req.topic and req.topic.strip() else "Random"
    is_correct = req.selected_answer.strip() == req.correct_answer.strip()

    try:
        _insert_with_available_columns(
            "user_progress",
            {
                "user_id": user_id,
                "selected_answer": req.selected_answer,
                "correct_answer": req.correct_answer,
                "exam": req.exam,
                "topic": topic,
                "is_correct": is_correct,
            },
            {"user_id", "is_correct"},
        )
    except APIError as exc:
        raise HTTPException(status_code=500, detail=f"Could not save progress: {exc}") from exc

    if not is_correct:
        try:
            _increment_weak_topic(user_id, req.exam, topic)
        except APIError as exc:
            raise HTTPException(status_code=500, detail=f"Could not update weak topics: {exc}") from exc

    return {"is_correct": is_correct}
