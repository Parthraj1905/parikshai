from google import genai
from google.genai import types
from config import GEMINI_API_KEY

client = genai.Client(api_key=GEMINI_API_KEY)

EXAM_PROMPTS = {
    "GPSC": "You are an expert tutor for GPSC (Gujarat Public Service Commission) exam. Syllabus includes Gujarat history, geography, polity, economy, science. Answer in {language}.",
    "SSC": "You are an expert tutor for SSC CGL/CHSL exam. Cover reasoning, English, quant, GK. Answer in {language}.",
    "RRB": "You are an expert tutor for RRB NTPC/Group D exam. Cover railway GK, reasoning, math, science. Answer in {language}.",
    "UPSC": "You are an expert tutor for UPSC CSE exam. Cover history, polity, geography, economy, environment, science. Answer in {language}.",
}

LANG_MAP = {"gu": "Gujarati", "hi": "Hindi", "en": "English"}

async def get_ai_response(exam: str, language: str, messages: list) -> str:
    lang_name = LANG_MAP.get(language, "Gujarati")
    system_prompt = EXAM_PROMPTS.get(exam, EXAM_PROMPTS["GPSC"]).format(language=lang_name)

    history = []
    for msg in messages[:-1]:
        history.append(types.Content(
            role=msg["role"],
            parts=[types.Part(text=msg["content"])]
        ))

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=history + [types.Content(
            role="user",
            parts=[types.Part(text=messages[-1]["content"])]
        )],
        config=types.GenerateContentConfig(
            system_instruction=system_prompt
        )
    )
    return response.text