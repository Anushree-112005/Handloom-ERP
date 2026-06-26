import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv(dotenv_path="/home/cubeai/Videos/Dinesh Export Textile /Dinesh_Textile(may 26)/backend/.env")
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

try:
    models = client.models.list()
    for m in models.data:
        print(m.id)
except Exception as e:
    print("Error:", e)
