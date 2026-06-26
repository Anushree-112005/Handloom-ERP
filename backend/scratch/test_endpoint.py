import os
from fastapi.testclient import TestClient
from dotenv import load_dotenv

# Load env variables
load_dotenv(dotenv_path="/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/backend/.env")

# Import FastAPI app
from app.main import app

client = TestClient(app)

image_path_1 = "/home/cubeai/.gemini/antigravity/brain/860c507b-a75d-4685-ae15-ae6d040e93aa/media__1782369090368.jpg"
image_path_2 = "/home/cubeai/.gemini/antigravity/brain/860c507b-a75d-4685-ae15-ae6d040e93aa/media__1782369079750.jpg"

if not os.path.exists(image_path_1) or not os.path.exists(image_path_2):
    print("Test images not found!")
    exit(1)

print("Sending request with multiple images...")
with open(image_path_1, "rb") as f1, open(image_path_2, "rb") as f2:
    response = client.post(
        "/api/v1/design-entries/extract-design",
        files=[
            ("files", (os.path.basename(image_path_1), f1, "image/jpeg")),
            ("files", (os.path.basename(image_path_2), f2, "image/jpeg"))
        ]
    )

print("Response status code:", response.status_code)
if response.status_code == 200:
    data = response.json()
    rows = data.get("rows", [])
    print(f"Extracted {len(rows)} rows in total.")
    for idx, row in enumerate(rows):
        print(f"Row {idx+1:02d} | Type: {row['type']} | Color: {row['color']} | Threads: {row['threads']} | Times: {row['times']}")
else:
    print("Error:", response.text)
