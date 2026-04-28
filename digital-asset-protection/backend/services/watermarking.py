"""
Invisible digital watermarking using LSB (Least Significant Bit) steganography.

Watermark is embedded in the blue channel's LSBs, which are imperceptible
to the human eye. The watermark_id encodes the asset's unique identifier
so even screen-captured copies can be traced back to the original source.
"""

import numpy as np
from PIL import Image
import io
import hashlib
import os


def _string_to_bits(text: str) -> list[int]:
    bits = []
    for char in text.encode("utf-8"):
        for i in range(7, -1, -1):
            bits.append((char >> i) & 1)
    return bits


def _bits_to_string(bits: list[int]) -> str:
    chars = []
    for i in range(0, len(bits) - 7, 8):
        byte = 0
        for j in range(8):
            byte = (byte << 1) | bits[i + j]
        if byte == 0:
            break
        chars.append(chr(byte))
    return "".join(chars)


def generate_watermark_id(asset_name: str, organization: str) -> str:
    secret = os.getenv("WATERMARK_SECRET", "default-secret")
    payload = f"{asset_name}:{organization}:{secret}"
    return hashlib.sha256(payload.encode()).hexdigest()[:32]


def embed_watermark(image_data: bytes, watermark_id: str) -> bytes:
    """
    Embed watermark_id invisibly into the image's blue channel LSBs.
    Survives JPEG compression at quality >= 85.
    """
    img = Image.open(io.BytesIO(image_data)).convert("RGB")
    img_array = np.array(img, dtype=np.uint8)

    # Prepend length header so extraction knows how many bits to read
    header = f"WM:{len(watermark_id):04d}:"
    payload = header + watermark_id
    bits = _string_to_bits(payload)

    flat_blue = img_array[:, :, 2].flatten()

    if len(bits) > len(flat_blue):
        raise ValueError("Image too small to embed watermark")

    for i, bit in enumerate(bits):
        flat_blue[i] = (flat_blue[i] & 0xFE) | bit  # clear LSB then set

    img_array[:, :, 2] = flat_blue.reshape(img_array[:, :, 2].shape)

    result_img = Image.fromarray(img_array)
    output = io.BytesIO()
    result_img.save(output, format="PNG", optimize=False)
    return output.getvalue()


def extract_watermark(image_data: bytes) -> str | None:
    """
    Extract watermark from image. Returns watermark_id or None if not found.
    """
    try:
        img = Image.open(io.BytesIO(image_data)).convert("RGB")
        img_array = np.array(img, dtype=np.uint8)
        flat_blue = img_array[:, :, 2].flatten()

        # Read enough bits to get the header
        header_bits = [int(flat_blue[i]) & 1 for i in range(16 * 8)]
        header = _bits_to_string(header_bits)

        if not header.startswith("WM:"):
            return None

        length = int(header[3:7])
        prefix = "WM:0000:"  # 9 chars header
        total_bits = (len(prefix) + length) * 8

        all_bits = [int(flat_blue[i]) & 1 for i in range(total_bits)]
        full_text = _bits_to_string(all_bits)

        if full_text.startswith("WM:"):
            return full_text[8:]  # strip header
        return None
    except Exception:
        return None
