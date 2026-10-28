import asyncio
import json
import re
from typing import Any, Optional

import httpx
from config import GROQ_API_KEY, GROQ_MODELS

GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
REQUEST_TIMEOUT = httpx.Timeout(120.0, connect=10.0)

EXAM_PROMPTS = {
    "GPSC": """You are a sharp GPSC exam tutor. Rules:
- Answer in {language}
- Be concise but ensure the answer is comprehensive and covers all key details of the question
- Avoid unnecessary fluff, but provide clear explanations
- Talk like a smart friend, not a textbook
- Use numbers (1. 2. 3.) only when user asks for a list or ranking
- Each numbered item on its own line
- Never put a list in one sentence""",

    "SSC": """You are a sharp SSC exam tutor. Rules:
- Answer in {language}
- Be concise but ensure the answer is comprehensive and covers all key details of the question
- Avoid unnecessary fluff, but provide clear explanations
- Talk like a smart friend, not a textbook
- Use numbers (1. 2. 3.) only when user asks for a list or ranking
- Each numbered item on its own line
- Never put a list in one sentence""",

    "RRB": """You are a sharp RRB exam tutor. Rules:
- Answer in {language}
- Be concise but ensure the answer is comprehensive and covers all key details of the question
- Avoid unnecessary fluff, but provide clear explanations
- Talk like a smart friend, not a textbook
- Use numbers (1. 2. 3.) only when user asks for a list or ranking
- Each numbered item on its own line
- Never put a list in one sentence""",

    "UPSC": """You are a sharp UPSC exam tutor. Rules:
- Answer in {language}
- Be concise but ensure the answer is comprehensive and covers all key details of the question
- Avoid unnecessary fluff, but provide clear explanations
- Talk like a smart friend, not a textbook
- Use numbers (1. 2. 3.) only when user asks for a list or ranking
- Each numbered item on its own line
- Never put a list in one sentence""",

    "GENERAL": """You are an expert Government Exam tutor covering UPSC, SSC, GPSC, RRB, State PSC and other competitive exams. Rules:
- Answer in {language}
- Be concise but ensure the answer is comprehensive and covers all key details of the question
- Avoid unnecessary fluff, but provide clear explanations
- Talk like a smart friend, not a textbook
- Use numbers (1. 2. 3.) only when the user asks for a list or ranking
- Each numbered item on its own line
- Never put a list in one sentence""",
}


LANG_MAP = {"gu": "Gujarati", "hi": "Hindi", "en": "English"}


class GroqServiceError(Exception):
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


def _retry_after_from_response(exc: httpx.HTTPStatusError) -> Optional[int]:
    # Prefer the Retry-After header, then the timestamp Groq puts in the error body.
    retry_after = exc.response.headers.get("retry-after")
    if retry_after:
        try:
            return max(1, int(float(retry_after)))
        except ValueError:
            pass
    try:
        detail = exc.response.json()
    except Exception:
        detail = {}
    if isinstance(detail, dict):
        message = str(detail.get("error", {}).get("message", "") if isinstance(detail.get("error"), dict) else detail.get("error", ""))
        match = re.search(r"(?:try again in|after)\s+([0-9]+(?:\.[0-9]+)?)\s*(?:s|sec|seconds|ms|milliseconds)", message, re.IGNORECASE)
        if match:
            value = float(match.group(1))
            if "ms" in match.group(0).lower():
                value = value / 1000.0
            return max(1, int(value))
    return None


def _groq_service_error(exc: httpx.HTTPStatusError, model: str) -> GroqServiceError:
    code = exc.response.status_code
    if code == 429:
        retry_after = _retry_after_from_response(exc)
        retry_text = f" Please retry after {retry_after} seconds." if retry_after else ""
        return GroqServiceError(
            (
                f"AI rate limit reached for model {model}.{retry_text}"
                " Check your Groq plan limits at console.groq.com or set GROQ_MODELS "
                "to a model with available quota."
            ),
            status_code=429,
            retry_after=retry_after,
        )

    if code in (401, 403):
        return GroqServiceError(
            "Groq API key is invalid or does not have access to this model.",
            status_code=502,
        )

    if code == 400:
        try:
            detail = exc.response.json().get("error", {}).get("message", str(exc))
        except Exception:
            detail = str(exc)
        return GroqServiceError(
            f"Groq rejected the request: {detail}",
            status_code=400,
        )

    return GroqServiceError(
        "AI service is temporarily unavailable. Please try again.",
        status_code=502,
    )


def _message_content(message: Any) -> str:
    if isinstance(message, dict):
        return str(message.get("content", "")).strip()
    return str(getattr(message, "content", "")).strip()


def _chat_messages(message: Any) -> dict:
    if isinstance(message, dict):
        role = message.get("role", "user")
        content = str(message.get("content", "")).strip()
    else:
        role = getattr(message, "role", "user")
        content = str(getattr(message, "content", "")).strip()
    if role not in ("user", "assistant", "system"):
        role = "user"
    return {"role": role, "content": content}


async def _generate_text(chat: list) -> str:
    if not GROQ_API_KEY:
        raise GroqServiceError(
            "Groq API key is not configured. Add GROQ_API_KEY to backend/.env.",
            status_code=503,
        )

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "messages": chat,
        "temperature": 0.7,
        "max_tokens": 4096,
    }

    last_quota_error = None
    last_api_error = None

    for model in GROQ_MODELS:
        payload["model"] = model
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                response = await client.post(GROQ_API_URL, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
        except httpx.HTTPStatusError as exc:
            service_error = _groq_service_error(exc, model)
            # Rate limit (429) → try the next model in the fallback chain.
            if service_error.status_code == 429:
                last_quota_error = service_error
                last_api_error = exc
                continue
            raise service_error from exc
        except httpx.HTTPError as exc:
            raise GroqServiceError(
                "AI service is temporarily unavailable. Please try again.",
                status_code=502,
            ) from exc

        break
    else:
        models = ", ".join(GROQ_MODELS)
        raise GroqServiceError(
            (
                f"No Groq model in GROQ_MODELS has available quota. Tried: {models}. "
                "Sign in at console.groq.com to check rate limits, or set GROQ_MODELS "
                "to a model that has non-zero quota."
            ),
            status_code=429,
            retry_after=last_quota_error.retry_after if last_quota_error else None,
        ) from last_api_error

    try:
        response_text = data["choices"][0]["message"]["content"] or ""
    except (KeyError, IndexError, TypeError) as exc:
        raise GroqServiceError(
            "AI service returned an unreadable response. Please try again.",
            status_code=502,
        ) from exc

    if not response_text.strip():
        raise GroqServiceError(
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
            raise GroqServiceError(
                "AI service returned invalid MCQ JSON. Please try again.",
                status_code=502,
            )
        try:
            parsed = json.loads(cleaned[start:end + 1])
        except json.JSONDecodeError as exc:
            raise GroqServiceError(
                "AI service returned invalid MCQ JSON. Please try again.",
                status_code=502,
            ) from exc

    if not isinstance(parsed, (dict, list)):
        raise GroqServiceError(
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
        raise GroqServiceError(
            "AI service returned incomplete MCQ data. Please try again.",
            status_code=502,
        )

    normalized_options = [str(option).strip() for option in options]
    if any(not option for option in normalized_options):
        raise GroqServiceError(
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
        raise GroqServiceError(
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
        raise GroqServiceError(
            "AI service returned invalid MCQ data. Please try again.",
            status_code=502,
        )

    questions = [_normalize_mcq(item) for item in data if isinstance(item, dict)]
    if len(questions) < count:
        raise GroqServiceError(
            "AI service returned fewer MCQs than requested. Please try again.",
            status_code=502,
        )

    return questions[:count]


async def get_ai_response(exam: str, language: str, messages: list) -> str:
    if not messages:
        raise GroqServiceError("Message is required.", status_code=400)

    user_message = _message_content(messages[-1])
    if not user_message:
        raise GroqServiceError("Message content is required.", status_code=400)

    lang_name = LANG_MAP.get(language, "Gujarati")
    system_prompt = EXAM_PROMPTS.get(exam, EXAM_PROMPTS["GENERAL"]).format(language=lang_name)

    chat = [{"role": "system", "content": system_prompt}]
    for msg in messages[:-1]:
        content = _message_content(msg)
        if not content:
            continue
        role = "assistant" if _is_assistant(msg) else "user"
        chat.append({"role": role, "content": content})

    # Guarantee the conversation ends with the current user message
    history = _merge_roles(chat[1:])
    if history and history[-1]["role"] == "user":
        history[-1]["content"] = (history[-1]["content"] + "\n\n" + user_message).strip()
    else:
        history.append({"role": "user", "content": user_message})
    chat = chat[:1] + history

    return await _generate_text(chat)


def _is_assistant(message: Any) -> bool:
    role = message.get("role") if isinstance(message, dict) else getattr(message, "role", "user")
    return role == "assistant"


def _merge_roles(messages: list) -> list:
    """Merge consecutive same-role turns so the history has no back-to-back duplicates."""
    merged = []
    for message in messages:
        if merged and merged[-1]["role"] == message["role"]:
            sep = "\n\n"
            merged[-1]["content"] = (merged[-1]["content"] + sep + message["content"]).strip()
        else:
            merged.append(dict(message))
    return merged


async def generate_mcqs(exam: str, language: str, topic: Optional[str] = None, count: int = 10) -> list:
    import random
    count = max(1, min(count, 10))
    lang_name = LANG_MAP.get(language, "Gujarati")
    topic_name = topic.strip() if topic and topic.strip() else "Random (mix of all topics)"

    # Random seed ensures Groq won't return the same cached set of questions
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
                [{"role": "user", "content": prompt}]
            )
            return _normalize_mcqs(_json_from_text(response_text), count)
        except GroqServiceError as exc:
            # Only retry on parse/validation errors (502), not quota (429) or auth (401/403) errors
            if exc.status_code != 502 or attempt == max_attempts - 1:
                raise
            last_error = exc
            await asyncio.sleep(0.5)

    raise last_error


async def generate_mcq(exam: str, language: str, topic: Optional[str] = None) -> dict:
    return (await generate_mcqs(exam, language, topic, 1))[0]
