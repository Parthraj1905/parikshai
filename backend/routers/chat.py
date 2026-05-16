from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from services.gemini import get_ai_response
from services.supabase_client import supabase

router = APIRouter()

class ChatRequest(BaseModel):
    exam: str
    language: str
    messages: list
    session_id: str = None

@router.post("/chat")
async def chat(req: ChatRequest, authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "")
    
    # Verify user
    user = supabase.auth.get_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    user_id = user.user.id
    
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
    
    # Get AI response
    ai_reply = await get_ai_response(req.exam, req.language, req.messages)
    
    # Increment counter
    supabase.table("profiles").update({
        "questions_used_today": p["questions_used_today"] + 1
    }).eq("id", user_id).execute()
    
    return {"reply": ai_reply}