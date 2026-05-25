import asyncio
import json
import re
from typing import Any, Optional

from google import genai
from google.genai import errors, types
from config import GEMINI_API_KEY, GEMINI_MODELS

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

EXAM_PROMPTS = {
    "GPSC": """You are a sharp GPSC exam tutor. Rules:
- Answer in {language}
- Keep answers SHORT and DIRECT
- Only explain in detail if user specifically asks "explain" or "વિસ્તારથી કહો"
- For factual questions: just give the fact
- Talk like a smart friend, not a textbook
- Use numbers (1. 2. 3.) only when user asks for a list or ranking
- Each numbered item on its own line
- Never put a list in one sentence""",

    "SSC": """You are a sharp SSC exam tutor. Rules:
- Answer in {language}
- Keep answers SHORT and DIRECT
- Only explain in detail if user specifically asks "explain"
- Talk like a smart friend, not a textbook
- Use numbers (1. 2. 3.) only when user asks for a list or ranking
- Each numbered item on its own line
- Never put a list in one sentence""",

    "RRB": """You are a sharp RRB exam tutor. Rules:
- Answer in {language}
- Keep answers SHORT and DIRECT
- Only explain in detail if user specifically asks "explain"
- Talk like a smart friend, not a textbook
- Use numbers (1. 2. 3.) only when user asks for a list or ranking
- Each numbered item on its own line
- Never put a list in one sentence""",

    "UPSC": """You are a sharp UPSC exam tutor. Rules:
- Answer in {language}
- Keep answers SHORT and DIRECT
- Only explain in detail if user specifically asks "explain"
- Talk like a smart friend, not a textbook
- Use numbers (1. 2. 3.) only when user asks for a list or ranking
- Each numbered item on its own line
- Never put a list in one sentence""",

    "GENERAL": """You are an expert Government Exam tutor covering UPSC, SSC, GPSC, RRB, State PSC and other competitive exams. Rules:
- Answer in {language}
- Keep answers SHORT and DIRECT
- Only explain in detail if the user asks "explain"
- For factual questions: just give the fact
- Talk like a smart friend, not a textbook
- Use numbers (1. 2. 3.) only when the user asks for a list or ranking
- Each numbered item on its own line
- Never put a list in one sentence""",
}


LANG_MAP = {"gu": "Gujarati", "hi": "Hindi", "en": "English"}


class GeminiServiceError(Exception):
    def __init__(
        self,
        message: str,
        status_code: int = 503,
        retry_after: Optional[int] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.retry_after = retry_after
        super().__init__(message)


def _quota_error_text(details: Any, message: Optional[str]) -> str:
    parts = [message or ""]
    if isinstance(details, dict):
        error = details.get("error", {})
        parts.append(str(error.get("message", "")))
        for detail in error.get("details", []):
            parts.append(str(detail.get("quotaMetric", "")))
            parts.append(str(detail.get("quotaId", "")))
            for violation in detail.get("violations", []):
                parts.append(str(violation.get("quotaMetric", "")))
                parts.append(str(violation.get("quotaId", "")))
    return " ".join(parts).lower()


def _api_error_text(exc: errors.APIError) -> str:
    return _quota_error_text(exc.details, exc.message)


def _is_daily_or_zero_quota(exc: errors.APIError) -> bool:
    text = _api_error_text(exc)
    return "limit: 0" in text or "perday" in text or "per day" in text


def _is_leaked_api_key(exc: errors.APIError) -> bool:
    return "reported as leaked" in _api_error_text(exc)


def _retry_after_seconds(details: Any, message: Optional[str]) -> Optional[int]:
    if isinstance(details, dict):
        error_details = details.get("error", {}).get("details", [])
        for detail in error_details:
            retry_delay = detail.get("retryDelay")
            if retry_delay and retry_delay.endswith("s"):
                try:
                    return max(1, int(float(retry_delay[:-1])))
                except ValueError:
                    pass

    if message:
        match = re.search(r"retry in\s+([0-9]+(?:\.[0-9]+)?)s", message, re.IGNORECASE)
        if match:
            return max(1, int(float(match.group(1))))

    return None


def _gemini_service_error(exc: errors.APIError, model: str) -> GeminiServiceError:
    if exc.code == 429 or exc.status == "RESOURCE_EXHAUSTED":
        daily_or_zero_quota = _is_daily_or_zero_quota(exc)
        retry_after = None if daily_or_zero_quota else _retry_after_seconds(exc.details, exc.message)
        retry_text = f" Please retry after {retry_after} seconds." if retry_after else ""
        quota_text = (
            " Gemini reported a daily or zero quota limit, so waiting one minute will not fix it."
            if daily_or_zero_quota
            else ""
        )
        return GeminiServiceError(
            (
                f"AI quota exhausted for model {model}."
                f"{retry_text}{quota_text}"
                " Check Gemini billing/quota or set GEMINI_MODELS to a model with available quota."
            ),
            status_code=429,
            retry_after=retry_after,
        )

    if exc.code in (401, 403):
        if _is_leaked_api_key(exc):
            return GeminiServiceError(
                (
                    "Gemini API key was reported as leaked. Create a new API key in "
                    "Google AI Studio, replace GEMINI_API_KEY in backend/.env, then restart the backend."
                ),
                status_code=503,
            )
        return GeminiServiceError(
            "Gemini API key is invalid or does not have access to this model.",
            status_code=502,
        )

    if exc.code == 400:
        detail = exc.message or "Bad request"
        return GeminiServiceError(
            f"Gemini rejected the request: {detail}",
            status_code=400,
        )

    return GeminiServiceError(
        "AI service is temporarily unavailable. Please try again.",
        status_code=502,
    )


def _message_content(message: Any) -> str:
    if isinstance(message, dict):
        return str(message.get("content", "")).strip()
    return str(getattr(message, "content", "")).strip()


def _message_role(message: Any) -> str:
    if isinstance(message, dict):
        role = message.get("role", "user")
    else:
        role = getattr(message, "role", "user")
    if role == "assistant":
        return "model"
    if role in ("user", "model"):
        return role
    return "user"


async def _generate_text(contents: list, config: types.GenerateContentConfig) -> str:
    if client is None:
        raise GeminiServiceError(
            "Gemini API key is not configured. Add GEMINI_API_KEY to backend/.env.",
            status_code=503,
        )

    last_quota_error = None
    last_api_error = None

    for model in GEMINI_MODELS:
        try:
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=model,
                contents=contents,
                config=config
            )
        except errors.APIError as exc:
            service_error = _gemini_service_error(exc, model)
            if service_error.status_code == 429:
                last_quota_error = service_error
                last_api_error = exc
                continue
            raise service_error from exc
        except Exception as exc:
            raise GeminiServiceError(
                "AI service is temporarily unavailable. Please try again.",
                status_code=502,
            ) from exc
        break
    else:
        models = ", ".join(GEMINI_MODELS)
        raise GeminiServiceError(
            (
                f"No Gemini model in GEMINI_MODELS has available quota. Tried: {models}. "
                "Open Google AI Studio quota/billing for this project, or set GEMINI_MODELS "
                "to a model that has non-zero quota."
            ),
            status_code=429,
            retry_after=last_quota_error.retry_after if last_quota_error else None,
        ) from last_api_error

    try:
        response_text = response.text
    except Exception as exc:
        raise GeminiServiceError(
            "AI service returned an unreadable response. Please try again.",
            status_code=502,
        ) from exc

    if not response_text:
        raise GeminiServiceError(
            "AI service returned an empty response. Please try again.",
            status_code=502,
        )

    return response_text


def _json_from_text(text: str) -> Any:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise GeminiServiceError(
                "AI service returned invalid MCQ JSON. Please try again.",
                status_code=502,
            )
        try:
            parsed = json.loads(cleaned[start:end + 1])
        except json.JSONDecodeError as exc:
            raise GeminiServiceError(
                "AI service returned invalid MCQ JSON. Please try again.",
                status_code=502,
            ) from exc

    if not isinstance(parsed, (dict, list)):
        raise GeminiServiceError(
            "AI service returned invalid MCQ JSON. Please try again.",
            status_code=502,
        )

    return parsed


def _normalize_mcq(data: dict) -> dict:
    question = str(data.get("question", "")).strip()
    options = data.get("options", [])
    correct = str(data.get("correct", "")).strip()
    explanation = str(data.get("explanation", "")).strip()

    if not question or not isinstance(options, list) or len(options) != 4 or not explanation:
        raise GeminiServiceError(
            "AI service returned incomplete MCQ data. Please try again.",
            status_code=502,
        )

    normalized_options = [str(option).strip() for option in options]
    if any(not option for option in normalized_options):
        raise GeminiServiceError(
            "AI service returned incomplete MCQ options. Please try again.",
            status_code=502,
        )

    letter_map = {"A": 0, "B": 1, "C": 2, "D": 3}
    correct_key = correct.rstrip(".):").upper()
    if correct_key in letter_map:
        correct = normalized_options[letter_map[correct_key]]
    elif correct not in normalized_options:
        for option in normalized_options:
            if option.lower() == correct.lower():
                correct = option
                break

    if correct not in normalized_options:
        raise GeminiServiceError(
            "AI service returned an MCQ answer that does not match the options. Please try again.",
            status_code=502,
        )

    return {
        "question": question,
        "options": normalized_options,
        "correct": correct,
        "explanation": explanation,
    }


def _normalize_mcqs(data: Any, count: int) -> list:
    if isinstance(data, dict) and isinstance(data.get("questions"), list):
        data = data["questions"]
    elif isinstance(data, dict):
        data = [data]

    if not isinstance(data, list):
        raise GeminiServiceError(
            "AI service returned invalid MCQ data. Please try again.",
            status_code=502,
        )

    questions = [_normalize_mcq(item) for item in data if isinstance(item, dict)]
    if len(questions) < count:
        raise GeminiServiceError(
            "AI service returned fewer MCQs than requested. Please try again.",
            status_code=502,
        )

    return questions[:count]


async def get_ai_response(exam: str, language: str, messages: list) -> str:
    if not messages:
        raise GeminiServiceError("Message is required.", status_code=400)

    user_message = _message_content(messages[-1])
    if not user_message:
        raise GeminiServiceError("Message content is required.", status_code=400)

    lang_name = LANG_MAP.get(language, "Gujarati")
    system_prompt = EXAM_PROMPTS.get(exam, EXAM_PROMPTS["GENERAL"]).format(language=lang_name)


    history = []
    for msg in messages[:-1]:
        content = _message_content(msg)
        if not content:
            continue
        history.append(types.Content(
            role=_message_role(msg),
            parts=[types.Part(text=content)]
        ))

    contents = history + [types.Content(
        role="user",
        parts=[types.Part(text=user_message)]
    )]
    config = types.GenerateContentConfig(system_instruction=system_prompt)

    return await _generate_text(contents, config)


async def generate_mcqs(exam: str, language: str, topic: Optional[str] = None, count: int = 10) -> list:
    import random
    count = max(1, min(count, 10))
    lang_name = LANG_MAP.get(language, "Gujarati")
    topic_name = topic.strip() if topic and topic.strip() else "Random (mix of all topics)"

    # Random seed ensures Gemini won't return the same cached set of questions
    seed = random.randint(10000, 99999)

    prompt = f"""You are an expert question-setter for Indian Government Competitive Exams (UPSC, SSC, GPSC, RRB, State PSC).

Generate EXACTLY {count} unique multiple-choice questions. Session seed: {seed}.

Topic: {topic_name}
Language: {lang_name}
Difficulty: Mix of medium and hard questions. Avoid very easy or trivial questions.
Style: Vary the question types — include factual, application-based, and analytical questions.
IMPORTANT: Every question MUST be different. Never repeat a question or use obvious/commonly repeated questions.

Return ONLY a valid JSON array with exactly {count} items, nothing else.
Each item MUST have exactly this shape:
{{
  "question": "Full question text in {lang_name}",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "correct": "<exact text of correct option>",
  "explanation": "Clear, brief explanation in {lang_name} (1-2 sentences)"
}}

Rules:
- The "correct" value MUST exactly match one of the 4 option strings (character-for-character)
- Options must be plausible — wrong options should not be obviously wrong
- Questions should test real exam knowledge, not common trivia
- No duplicate questions"""

    max_attempts = 3
    last_error = None
    for attempt in range(max_attempts):
        try:
            response_text = await _generate_text(
                [types.Content(role="user", parts=[types.Part(text=prompt)])],
                types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.95,
                ),
            )
            return _normalize_mcqs(_json_from_text(response_text), count)
        except GeminiServiceError as exc:
            # Only retry on parse/validation errors (502), not quota (429) or auth (401/403) errors
            if exc.status_code != 502 or attempt == max_attempts - 1:
                raise
            last_error = exc
            await asyncio.sleep(0.5)

    raise last_error


async def generate_mcq(exam: str, language: str, topic: Optional[str] = None) -> dict:
    return (await generate_mcqs(exam, language, topic, 1))[0]

