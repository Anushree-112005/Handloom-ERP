#!/usr/bin/env python3
"""
High-Precision Pixtral Vision Document Transcription Script (Hybrid OCR + Vision)

Features:
1. Mistral Native Pixel OCR (`mistral-ocr-latest`) for ground-truth character verification.
2. Pixtral Vision (`pixtral-12b-2409` with `temperature=0.0`) for deterministic layout & table synthesis.
3. Textile Domain Normalization: Corrects handwritten optical misreads (e.g. 'NANY' -> 'NAVY').

Usage:
  # Process folder:
  python3 pixtral_ocr.py --image-dir test_img --output-dir output3/pixtral_alone

  # Process single file:
  python3 pixtral_ocr.py --file "test_img/WhatsApp Image 2026-07-28 at 9.27.35 AM.jpeg" --output-dir output3/pixtral_alone
"""

import os
import sys
import time
import base64
import re
import argparse
from pathlib import Path
import dotenv
from mistralai.client import Mistral

# Load environment variables from .env
dotenv.load_dotenv(override=True)
MISTRAL_API_KEY = os.getenv("mistral_api_key") or os.getenv("MISTRAL_API_KEY")

def encode_image_to_base64(image_path: Path) -> str:
    """Encodes a local image file into a base64 string."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def normalize_textile_domain_terms(text: str) -> str:
    """Post-processing normalization to fix common handwritten optical OCR misreads."""
    # Fix NANY -> NAVY (handwritten V misread as N)
    text = re.sub(r'\bNANY\b', 'NAVY', text, flags=re.IGNORECASE)
    text = re.sub(r'\bNany\b', 'Navy', text)
    text = re.sub(r'\bnany\b', 'navy', text)
    return text

def process_image_hybrid_pixtral(image_path: Path, client: Mistral, model: str = "pixtral-12b-2409") -> tuple[str, float]:
    """
    Two-Pass Hybrid Extraction:
    Pass 1: mistral-ocr-latest -> extracts raw pixel OCR tokens.
    Pass 2: pixtral-12b-2409 (temperature=0.0) -> synthesizes layout and verifies digits against Pass 1.
    """
    start_time = time.time()
    
    img_b64 = encode_image_to_base64(image_path)
    data_url = f"data:image/jpeg;base64,{img_b64}"
    
    # Pass 1: Native OCR for character accuracy
    ocr_response = client.ocr.process(
        model="mistral-ocr-latest",
        document={
            "type": "image_url",
            "image_url": data_url
        }
    )
    raw_ocr_reference = "\n\n".join([page.markdown for page in ocr_response.pages]).strip()

    # Pass 2: Pixtral Vision (deterministic, temperature=0.0) with OCR Ground-Truth prompt
    prompt = f"""You are a high-precision OCR verification and textile document formatting engine.
Your task is to transcribe this handwritten/printed document into an EXACT DIGITAL COPY in Markdown (.md) format.

CRITICAL GROUND-TRUTH REFERENCE (From Pixel OCR):
Below is the raw character recognition data extracted by mistral-ocr-latest. Use it to resolve ambiguous handwritten digits (e.g. verify if a number is 68 vs 88, 14 vs 19, 34 vs 84):

<RAW_OCR_REFERENCE>
{raw_ocr_reference}
</RAW_OCR_REFERENCE>

TEXTILE DOMAIN CORRECTION RULES:
1. Normalize color names: The handwritten word 'NANY' or 'NANY-' is the textile yarn color 'NAVY'. Always write 'NAVY'.
2. Standardize textile terms: 'NAVY', 'WHITE', 'RED', 'MAROON', 'VIOLET', 'BROWN', 'L.BROWN', 'WARP', 'WEFT'.

Formatting Guidelines:
1. Replicate the physical layout using Markdown tables, headers, subheaders, and lists.
2. For multi-column ledgers (e.g. WARP vs WEFT), format them as clean side-by-side Markdown tables.
3. Transcribe every number, count, unit, color, and calculation with 100% fidelity.
4. Return ONLY the raw Markdown transcription without conversational preamble or commentary.
"""

    response = client.chat.complete(
        model=model,
        temperature=0.0,  # Deterministic mode
        messages=[{
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": data_url},
                {"type": "text", "text": prompt}
            ]
        }]
    )
    
    elapsed = time.time() - start_time
    content = response.choices[0].message.content.strip()
    
    if content.startswith("```markdown"):
        content = content[11:]
    if content.startswith("```"):
        content = content[3:]
    if content.endswith("```"):
        content = content[:-3]
        
    content = normalize_textile_domain_terms(content.strip())
    return content, elapsed

def main():
    parser = argparse.ArgumentParser(description="Deterministic Hybrid Pixtral Document Transcriber")
    parser.add_argument("--image-dir", type=str, default=None, help="Directory containing images to process")
    parser.add_argument("--file", type=str, default=None, help="Single image file to process")
    parser.add_argument("--output-dir", type=str, default="output3/pixtral_alone", help="Directory to save .md files")
    parser.add_argument("--model", type=str, default="pixtral-12b-2409", help="Mistral vision model tag (default: pixtral-12b-2409)")
    args = parser.parse_args()

    if not MISTRAL_API_KEY:
        print("ERROR: API Key not found! Please ensure 'mistral_api_key' is defined in .env")
        sys.exit(1)

    client = Mistral(api_key=MISTRAL_API_KEY)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    image_files = []
    if args.file:
        file_path = Path(args.file)
        if file_path.exists():
            image_files.append(file_path)
        else:
            print(f"ERROR: Specified file does not exist: {args.file}")
            sys.exit(1)
    else:
        img_dir = Path(args.image_dir if args.image_dir else "test_img")
        if not img_dir.exists():
            print(f"ERROR: Specified directory does not exist: {img_dir}")
            sys.exit(1)
        image_files = sorted([f for f in img_dir.glob("*") if f.suffix.lower() in [".jpg", ".jpeg", ".png"]])

    if not image_files:
        print("No valid images found to process.")
        return

    print(f"Found {len(image_files)} image(s) to process using Hybrid Pixtral (Deterministic temperature=0.0)...\n")

    for img_path in image_files:
        print(f"Processing: {img_path.name} ...")
        try:
            markdown_out, duration = process_image_hybrid_pixtral(img_path, client, model=args.model)
            out_file = output_dir / f"{img_path.stem}.md"
            out_file.write_text(markdown_out, encoding="utf-8")
            print(f"  [✓] Saved to {out_file} (Took {duration:.2f}s)\n")
        except Exception as e:
            print(f"  [✗] Failed to process {img_path.name}: {e}\n")

    print(f"All processing complete! Results saved in '{output_dir}/'")

if __name__ == "__main__":
    main()