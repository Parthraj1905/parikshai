import httpx
import asyncio
from dotenv import load_dotenv
import os

load_dotenv("backend/.env", override=True)
KEY = os.getenv("RAZORPAY_KEY_ID")
SECRET = os.getenv("RAZORPAY_KEY_SECRET")
PLAN = os.getenv("RAZORPAY_PRO_MONTHLY_PLAN_ID")

async def test():
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://api.razorpay.com/v1/subscriptions",
            auth=(KEY, SECRET),
            json={
                "plan_id": PLAN,
                "total_count": 12,
                "customer_notify": 0
            }
        )
        print(res.status_code, res.text)

asyncio.run(test())
