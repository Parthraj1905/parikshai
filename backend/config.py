from dotenv import load_dotenv
import os

load_dotenv(override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")
RAZORPAY_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET")
RAZORPAY_PRO_MONTHLY_PLAN_ID = os.getenv("RAZORPAY_PRO_MONTHLY_PLAN_ID")

DEFAULT_GROQ_MODELS = (
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
    "qwen/qwen3.8-27b",
)


def _parse_groq_models(value):
    models = []
    for model in value.split(","):
        model = model.strip()
        if model and model not in models:
            models.append(model)
    return tuple(models)


GROQ_MODELS = _parse_groq_models(
    os.getenv("GROQ_MODELS", ",".join(DEFAULT_GROQ_MODELS))
)
