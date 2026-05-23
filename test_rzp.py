import httpx
import asyncio
from dotenv import load_dotenv
import os

load_dotenv("backend/.env", override=True)
KEY = os.getenv("RAZORPAY_KEY_ID")
SECRET = os.getenv("RAZORPAY_KEY_SECRET")

async def test():
    async with httpx.AsyncClient() as client:
        # url encode the email
        res = await client.get(
            "https://api.razorpay.com/v1/customers?email=parthrajsinhparmar19@gmail.com",
            auth=(KEY, SECRET)
        )
        print(res.status_code, res.text[:200])

asyncio.run(test())
