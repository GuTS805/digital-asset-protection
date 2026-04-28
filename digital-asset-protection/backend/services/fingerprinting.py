"""
Perceptual hashing fingerprinting service.

Uses multiple hash algorithms so a single algorithm weakness doesn't
cause missed detections. pHash is most robust to compression/resize;
dHash catches gradient changes; aHash catches luminance shifts.
"""

import imagehash
from PIL import Image
import io
import numpy as np
from typing import Optional


SIMILARITY_THRESHOLD = 12  # Hamming distance — images with distance <= this are flagged


def generate_fingerprint(image_data: bytes) -> dict:
    img = Image.open(io.BytesIO(image_data)).convert("RGB")
    return {
        "phash": str(imagehash.phash(img)),
        "dhash": str(imagehash.dhash(img)),
        "ahash": str(imagehash.average_hash(img)),
        "whash": str(imagehash.whash(img)),
    }


def hamming_distance(hash1: str, hash2: str) -> int:
    try:
        h1 = imagehash.hex_to_hash(hash1)
        h2 = imagehash.hex_to_hash(hash2)
        return h1 - h2
    except Exception:
        return 64  # Max distance on error


def similarity_score(hash1: str, hash2: str) -> float:
    """Returns 0.0 (different) to 1.0 (identical)."""
    dist = hamming_distance(hash1, hash2)
    return max(0.0, 1.0 - dist / 64.0)


def is_similar(phash1: str, phash2: str, dhash1: str = "", dhash2: str = "") -> bool:
    """
    Returns True if two assets are likely the same content.
    Requires BOTH phash and dhash to be similar to reduce false positives.
    """
    p_dist = hamming_distance(phash1, phash2)
    if p_dist > SIMILARITY_THRESHOLD:
        return False
    if dhash1 and dhash2:
        d_dist = hamming_distance(dhash1, dhash2)
        return d_dist <= SIMILARITY_THRESHOLD + 4  # dhash slightly more lenient
    return True


def compare_against_database(
    image_data: bytes, registered_assets: list
) -> list[dict]:
    """
    Compare uploaded/found image against all registered assets.
    Returns list of matches with similarity scores.
    """
    fp = generate_fingerprint(image_data)
    matches = []

    for asset in registered_assets:
        score = similarity_score(fp["phash"], asset.get("phash", ""))
        if score >= (1.0 - SIMILARITY_THRESHOLD / 64.0):
            matches.append(
                {
                    "asset_id": asset["id"],
                    "asset_name": asset["name"],
                    "similarity_score": round(score, 4),
                    "phash_distance": hamming_distance(fp["phash"], asset["phash"]),
                }
            )

    return sorted(matches, key=lambda x: x["similarity_score"], reverse=True)


def generate_hash_grid(phash: str) -> list[list[int]]:
    """Convert a pHash string to an 8x8 binary grid for visualization."""
    h = imagehash.hex_to_hash(phash)
    bits = h.hash.flatten().tolist()
    return [bits[i * 8 : (i + 1) * 8] for i in range(8)]
