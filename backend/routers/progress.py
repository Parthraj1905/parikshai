from fastapi import APIRouter, Header, HTTPException
from services.supabase_client import supabase

router = APIRouter()


def _topic_label(topic):
    return topic or "Random"


@router.get("/progress")
async def get_progress(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user = supabase.auth.get_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    user_id = user.user.id
    
    progress = supabase.table("user_progress").select("id,is_correct,question_id").eq("user_id", user_id).execute()
    weak = supabase.table("weak_topics").select("*").eq("user_id", user_id).order("wrong_count", desc=True).execute()

    attempts = progress.data or []
    weak_topics = weak.data or []
    total_answered = len(attempts)
    correct = sum(1 for p in attempts if p.get("is_correct"))
    wrong = total_answered - correct
    accuracy = round((correct / total_answered) * 100) if total_answered else 0

    weak_by_exam = {}
    for item in weak_topics:
        exam = item.get("exam") or "General"
        wrong_count = item.get("wrong_count") or 0
        if exam not in weak_by_exam:
            weak_by_exam[exam] = {"exam": exam, "wrong_count": 0, "topics": 0}
        weak_by_exam[exam]["wrong_count"] += wrong_count
        weak_by_exam[exam]["topics"] += 1

    top_weak_topic = weak_topics[0] if weak_topics else None
    if total_answered == 0:
        recommendation = "Start with one MCQ set to unlock your progress insights."
    elif top_weak_topic:
        recommendation = f"Practice {_topic_label(top_weak_topic.get('topic'))} next."
    elif accuracy >= 80:
        recommendation = "Strong run. Keep mixing random practice with revision."
    else:
        recommendation = "Answer a few more MCQs so weak topics can be detected."

    recent_attempts = [
        {
            "id": item.get("id"),
            "question_id": item.get("question_id"),
            "is_correct": item.get("is_correct"),
        }
        for item in attempts[-5:][::-1]
    ]
    
    return {
        "total_answered": total_answered,
        "correct": correct,
        "wrong": wrong,
        "accuracy": accuracy,
        "weak_topics": weak_topics[:5],
        "weak_by_exam": sorted(
            weak_by_exam.values(),
            key=lambda item: item["wrong_count"],
            reverse=True,
        ),
        "recent_attempts": recent_attempts,
        "recommendation": recommendation,
    }
