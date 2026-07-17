import os
import base64
from dotenv import load_dotenv
load_dotenv("/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/backend/.env")

from groq import Groq
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

image_path = "/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/backend/uploads/designs/REF-DE-00001_734ef7a4.jpeg"
with open(image_path, "rb") as f:
    encoded = base64.b64encode(f.read()).decode("utf-8")

classification_prompt = """
Analyze this image of a textile design sheet.
Classify it into one of the following categories:
1. "olive_white" if it contains ONLY "OLIVE" (or Greenish-Olive) and "WHITE" (or H.White) yarn repeat tables.
2. "navy_red" if it contains ONLY "NAVY", "RED", and "WHITE" (or H.White) yarn repeat tables (strictly no other color like brown, blue, yellow, etc.).
3. "other" if it is a custom handwritten paper, notebook page, or other general design sheet with a different color/pattern layout (such as containing brown, black, grey, etc., or having a different structure).

Return ONLY a JSON object: {"type": "olive_white" | "navy_red" | "other"}
"""

try:
    completion = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": classification_prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{encoded}",
                        },
                    },
                ],
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.0
    )
    print("Classification Response:", completion.choices[0].message.content)
except Exception as e:
    print("Classification Error:", e)

extraction_prompt = """
Analyze this handwritten textile design sheet.
Extract all yarn specification entries for BOTH the Warp and Weft design sections.

Warp Design section:
Look for entries under headings like "WARP DESIGN", "WARP", etc.
Extract each entry in order. For each warp entry, extract:
- yarn_count: e.g. "40s", "20s", "2/40s". If a yarn count is not written on a line but is written above it or in the section header, carry it down.
- color: e.g. "D.Blue", "H.White", "Navy", "Red", "Olive", "L.Brown".
- threads: The number of threads/ends (integer).
- times: If multiple rows are grouped with a repeat multiplier, extract the multiplier. Default to "1".

Weft Design section:
Look for entries under headings like "WEFT DESIGN", "WEFT", etc.
Extract each entry in order. For each weft entry, extract:
- yarn_count: e.g. "20s", "40s".
- color: e.g. "H.White", "Navy", "Red", "Olive", "L.Brown".
- threads: The number of threads/ends/picks (integer).

Return ONLY a JSON object of this structure:
{
  "warp": [
    {"yarn_count": "40s", "color": "D.Blue", "threads": 8, "times": "1"},
    ...
  ],
  "weft": [
    {"yarn_count": "20s", "color": "H.White", "threads": 3245}
  ]
}
"""

try:
    completion2 = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": extraction_prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{encoded}",
                        },
                    },
                ],
            }
        ],
        response_format={"type": "json_object"},
        temperature=0.0
    )
    print("Extraction Response:", completion2.choices[0].message.content)
except Exception as e:
    print("Extraction Error:", e)
