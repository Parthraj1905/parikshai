from dotenv import load_dotenv
import os

load_dotenv(override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")
RAZORPAY_PRO_MONTHLY_PLAN_ID = os.getenv("RAZORPAY_PRO_MONTHLY_PLAN_ID")

DEFAULT_GEMINI_MODELS = (
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash",
)
GEMINI_MODEL = os.getenv("GEMINI_MODEL", DEFAULT_GEMINI_MODELS[0])


def _parse_gemini_models(value):
    models = []
    for model in value.split(","):
        model = model.strip()
        if model and model not in models:
            models.append(model)
    return tuple(models)


GEMINI_MODELS = _parse_gemini_models(
    os.getenv("GEMINI_MODELS", ",".join((GEMINI_MODEL, *DEFAULT_GEMINI_MODELS)))
)
