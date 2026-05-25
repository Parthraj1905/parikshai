import asyncio
from fastapi.testclient import TestClient
from main import app
from services.supabase_client import supabase
import uuid

# Mock the user verification
from routers import billing

class MockUser:
    id = "13e51a66-fbd2-4965-a89e-dc3986047c61" # We need a valid uuid from profiles, or just any uuid
    email = "test@example.com"

def mock_get_user(auth):
    return MockUser()

billing._get_user = mock_get_user

client = TestClient(app)
res = client.post("/api/billing/subscription", headers={"Authorization": "Bearer fake"})
print(res.status_code)
print(res.text)
