import requests
import os

filename = "evidence_1_1765540589.279075.png"
url = f"http://127.0.0.1:8000/uploads/{filename}"

print(f"Checking URL: {url}")
try:
    r = requests.get(url, timeout=2)
    print(f"Status: {r.status_code}")
    if r.status_code != 200:
        print(r.text)
except Exception as e:
    print(f"Request failed: {e}")

# Check file on disk
path = os.path.join("backend", "uploads", filename)
print(f"File on disk ({path}): {os.path.exists(path)}")
