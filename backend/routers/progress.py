from fastapi import APIRouter, Header, HTTPException
from services.supabase_client import supabase

router = APIRouter()

@router.get("/progress")
async def get_progress(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    user = supabase.auth.get_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    user_id = user.user.id
    
    progress = supabase.table("user_progress").select("*").eq("user_id", user_id).execute()
    weak = supabase.table("weak_topics").select("*").eq("user_id", user_id).order("wrong_count", desc=True).execute()
    
    return {
        "total_answered": len(progress.data),
        "correct": sum(1 for p in progress.data if p["is_correct"]),
        "weak_topics": weak.data[:5]
    }