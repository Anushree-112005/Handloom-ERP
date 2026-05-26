from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)
response = client.get("/api/v1/employees/")
print(response.status_code)
print(response.text)
try:
    print(response.json())
except:
    pass
