import os
import time
import base64
import dotenv
from pathlib import Path
try:
    from mistralai.client import Mistral
except ImportError:
    from mistralai import Mistral  # type: ignore

# Load environment variables
dotenv.load_dotenv(override=True)

PROMPT_TRANSCRIPTION = """You are a high-precision OCR and document digitization engine.
Transcribe the provided handwritten or printed technical specification sheet into an EXACT DIGITAL COPY in Markdown (.md) format.

Guidelines:
1. Preserve all structural elements using Markdown tables, headers, subheaders, horizontal lines, and bullet lists.
2. For two-column layouts (e.g. WARP DESIGN vs WEFT DESIGN), structure them as clean Markdown tables.
3. Transcribe every number, count, unit, color (e.g., Maroon, Black, Brown, Violet, Navy, Red), code, calculation, and note with 100% accuracy.
4. Output ONLY the raw Markdown transcription without conversational preamble or commentary.
"""

def get_mistral_client() -> Mistral:
    """Retrieves configured Mistral client instance using environment variables."""
    api_key = os.getenv("mistral_api_key") or os.getenv("MISTRAL_API_KEY")
    if not api_key:
        raise ValueError("Mistral API Key not found! Please ensure 'mistral_api_key' or 'MISTRAL_API_KEY' is set in .env")
    return Mistral(api_key=api_key)

def encode_bytes_to_base64(image_bytes: bytes) -> str:
    """Encodes image bytes into a base64 string."""
    return base64.b64encode(image_bytes).decode("utf-8")

def encode_file_to_base64(image_path: Path | str) -> str:
    """Encodes a local image file into a base64 string."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

import re

def normalize_textile_domain_terms(text: str) -> str:
    """Post-processing normalization to fix common handwritten optical OCR misreads."""
    if not text:
        return ""
    text = re.sub(r'\bNANY\b', 'NAVY', text, flags=re.IGNORECASE)
    text = re.sub(r'\bNany\b', 'Navy', text)
    text = re.sub(r'\bnany\b', 'navy', text)
    return text

def process_image_bytes_with_pixtral(
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
    model: str = "pixtral-12b-2409",
    prompt: str | None = None,
    temperature: float = 0.0
) -> tuple[str, float]:
    """
    Sends raw image bytes to Mistral 2-pass Hybrid OCR + Vision pipeline:
    Pass 1: mistral-ocr-latest for pixel character recognition ground truth.
    Pass 2: pixtral-12b-2409 for layout & structural synthesis.
    Returns (content, elapsed_seconds).
    """
    client = get_mistral_client()
    start_time = time.time()
    
    img_b64 = encode_bytes_to_base64(image_bytes)
    data_url = f"data:{mime_type};base64,{img_b64}"
    
    # Pass 1: Native Pixel OCR for character ground-truth verification
    raw_ocr_reference = ""
    try:
        ocr_res = client.ocr.process(
            model="mistral-ocr-latest",
            document={"type": "image_url", "image_url": data_url}
        )
        if hasattr(ocr_res, "pages") and ocr_res.pages:
            raw_ocr_reference = "\n\n".join([page.markdown for page in ocr_res.pages if getattr(page, "markdown", None)]).strip()
            print(f"[PIXTRAL HYBRID OCR] Pass 1 Pixel OCR extracted {len(raw_ocr_reference)} chars of ground-truth data.")
    except Exception as ocr_err:
        print(f"[PIXTRAL HYBRID OCR WARNING] Pass 1 Pixel OCR unavailable ({ocr_err}). Proceeding with vision pass...")

    base_prompt = prompt if prompt else PROMPT_TRANSCRIPTION
    
    if raw_ocr_reference:
        text_prompt = f"""CRITICAL GROUND-TRUTH CHARACTER OCR REFERENCE (Extracted by mistral-ocr-latest):
Below is raw character recognition data. Use it to resolve ambiguous handwritten digits (e.g. verify 68 vs 28, 14 vs 19, 34 vs 84, and calculations like 370 x 11R, 424):

<RAW_OCR_REFERENCE>
{raw_ocr_reference}
</RAW_OCR_REFERENCE>

{base_prompt}"""
    else:
        text_prompt = base_prompt

    response = client.chat.complete(
        model=model,
        temperature=temperature,
        messages=[{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": data_url},
                {"type": "text", "text": text_prompt}
            ]
        }]
    )
    
    elapsed = time.time() - start_time
    content = response.choices[0].message.content.strip()
    
    # Strip markdown code block wrapping if present
    if content.startswith("```markdown"):
        content = content[11:]
    if content.startswith("```json"):
        content = content[7:]
    if content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
        
    content = normalize_textile_domain_terms(content.strip())
    return content, elapsed


def call_pixtral_vision(
    image_bytes: bytes,
    prompt: str,
    mime_type: str = "image/jpeg",
    model: str = "pixtral-12b-2409"
) -> str:
    """Helper for design entry vision extraction returning raw content text."""
    content, _ = process_image_bytes_with_pixtral(image_bytes, mime_type=mime_type, model=model, prompt=prompt)
    return content


def process_image_file_with_pixtral(
    image_path: Path | str,
    model: str = "pixtral-12b-2409"
) -> tuple[str, float]:
    """
    Sends a local image file to Mistral Pixtral vision model for structured Markdown extraction.
    Returns (markdown_content, elapsed_seconds).
    """
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image file not found: {image_path}")
        
    with open(path, "rb") as f:
        content = f.read()
        
    ext = path.suffix.lower()
    mime = "image/png" if ext == ".png" else "image/jpeg"
    return process_image_bytes_with_pixtral(content, mime_type=mime, model=model)
