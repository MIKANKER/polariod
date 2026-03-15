"""
Test API endpoint to see actual error
"""
import requests

# Test GET /api/templates
response = requests.get(
    "http://localhost:8000/api/templates",
    headers={"Authorization": "Bearer fake-token"}
)

print(f"Status Code: {response.status_code}")
print(f"Response: {response.text}")
