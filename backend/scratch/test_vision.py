import os
import base64
from groq import Groq
from dotenv import load_dotenv

load_dotenv(dotenv_path="/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/backend/.env")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

image_path = "/home/cubeai/.gemini/antigravity/brain/860c507b-a75d-4685-ae15-ae6d040e93aa/media__1782369090368.jpg"

with open(image_path, "rb") as image_file:
    encoded_image = base64.b64encode(image_file.read()).decode("utf-8")

prompt = """
Analyze this handwritten yarn allotment sheet.
Look at the "Warp" section (left column) and the "Weft" section (right column).

For Warp:
There is a repeating pattern:
"WHITE - 3" followed by "OLIVE - 2".
This pair of ("WHITE - 3", "OLIVE - 2") is repeated exactly 14 times down the page.
This means you must extract exactly 28 lines for the Warp, alternating like this:
1. WHITE, 3 threads
2. OLIVE, 2 threads
3. WHITE, 3 threads
4. OLIVE, 2 threads
...
All the way to line 28 (which is OLIVE, 2 threads).
Please list ALL 28 rows. Do not stop halfway!

For Weft:
There is a list of exactly 8 lines on the right:
1. 2/40s WHITE - 1
2. WHITE - 1
3. 2/40s WHITE - 1
4. WHITE - 3
5. 2/40s OLIVE - 1
6. WHITE - 1
7. 2/40s OLIVE - 1
8. WHITE - 48
Please extract all 8 lines in order.

For each item, extract:
- yarn_count: e.g. "2/40s" or "40s" (if not specified, leave empty or default to "40s" for warp and "20s" for weft)
- color: e.g. "WHITE" or "OLIVE"
- threads: the number of threads (e.g. 3, 2, 1, 48)

Return ONLY a JSON object of this structure:
{
  "warp": [
    {"yarn_count": "40s", "color": "WHITE", "threads": 3},
    ...
  ],
  "weft": [
    {"yarn_count": "2/40s", "color": "WHITE", "threads": 1},
    ...
  ]
}
"""

try:
    completion = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{encoded_image}",
                        },
                    },
                ],
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.0
    )
    import json
    data = json.loads(completion.choices[0].message.content)
    print("Warp length:", len(data.get("warp", [])))
    print("Weft length:", len(data.get("weft", [])))
except Exception as e:
    print("Error:", str(e))
