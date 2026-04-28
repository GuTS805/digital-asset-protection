"""
Demo data seeder — POST /api/demo/seed
Creates realistic demo assets and violations so you can walk through the
product without needing to upload real files or run actual scans.
"""
import uuid
import datetime
import io
import base64

from fastapi import APIRouter
from PIL import Image, ImageDraw

from database import get_db

router = APIRouter()


# ── helpers ──────────────────────────────────────────────────────────────────

def _make_placeholder(label: str, bg: tuple, accent: tuple) -> str:
    """Generate a small 480x270 placeholder image as a data URL."""
    img = Image.new("RGB", (480, 270), bg)
    draw = ImageDraw.Draw(img)
    # subtle grid lines
    for x in range(0, 480, 40):
        draw.line([(x, 0), (x, 270)], fill=(*accent[:3], 30), width=1)
    for y in range(0, 270, 40):
        draw.line([(0, y), (480, y)], fill=(*accent[:3], 30), width=1)
    # center badge
    draw.rounded_rectangle([160, 90, 320, 180], radius=12, fill=accent)
    # label text
    draw.text((215, 120), label[:3].upper(), fill="white")
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=80)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()


_NOW = datetime.datetime.utcnow

DEMO_ASSETS = [
    {
        "id": "demo-asset-001",
        "name": "Champions League Final 2024",
        "description": "Full match broadcast — Real Madrid vs Borussia Dortmund, Wembley Stadium",
        "media_type": "image",
        "phash": "9611cd7863670835",
        "dhash": "a5b4c3d2e1f09182",
        "ahash": "f0e1d2c3b4a59687",
        "watermark_id": "WM-UCL-2024-001",
        "organization": "UEFA Media Rights",
        "tags": ["football", "UEFA", "Champions League", "2024"],
        "status": "monitoring",
        "scan_count": 14,
        "violation_count": 3,
        "image_bg": (15, 23, 42),
        "image_accent": (37, 99, 235),
        "image_label": "UCL",
    },
    {
        "id": "demo-asset-002",
        "name": "Wimbledon 2024 Final Highlights",
        "description": "Carlos Alcaraz vs Novak Djokovic — Centre Court highlight reel",
        "media_type": "image",
        "phash": "3c4d5e6f7a8b9c0d",
        "dhash": "1a2b3c4d5e6f7081",
        "ahash": "8090a1b2c3d4e5f6",
        "watermark_id": "WM-WIM-2024-002",
        "organization": "All England Club",
        "tags": ["tennis", "Wimbledon", "Grand Slam", "2024"],
        "status": "monitoring",
        "scan_count": 9,
        "violation_count": 2,
        "image_bg": (15, 40, 15),
        "image_accent": (22, 163, 74),
        "image_label": "WIM",
    },
    {
        "id": "demo-asset-003",
        "name": "Paris 2024 Olympics Opening Ceremony",
        "description": "Official broadcast footage — Seine River ceremony segment",
        "media_type": "image",
        "phash": "7e8f9a0b1c2d3e4f",
        "dhash": "b1c2d3e4f5061728",
        "ahash": "3040506070819293",
        "watermark_id": "WM-OLY-2024-003",
        "organization": "IOC Broadcast Rights",
        "tags": ["Olympics", "Paris 2024", "ceremony", "broadcast"],
        "status": "monitoring",
        "scan_count": 21,
        "violation_count": 5,
        "image_bg": (40, 10, 40),
        "image_accent": (168, 85, 247),
        "image_label": "OLY",
    },
]

DEMO_VIOLATIONS = [
    # UCL violations
    {
        "id": "demo-vio-001",
        "asset_id": "demo-asset-001",
        "source_url": "https://www.youtube.com/watch?v=UCLFinal2024Clip",
        "source_platform": "YouTube",
        "similarity_score": 0.97,
        "evidence_url": "https://i.ytimg.com/vi/UCLFinal2024Clip/hqdefault.jpg",
        "ai_analysis": "High-confidence match detected. The video appears to be a direct re-upload of official UCL Final broadcast footage (Real Madrid vs Dortmund, 79th minute goal sequence). Similarity score of 97% across pHash, dHash, and aHash algorithms. The content has been trimmed by ~3 seconds but watermark signature WM-UCL-2024-001 is intact. Recommend immediate takedown notice.",
        "status": "confirmed",
        "days_ago": 2,
        "severity": "critical",
    },
    {
        "id": "demo-vio-002",
        "asset_id": "demo-asset-001",
        "source_url": "https://twitter.com/sportsnews/status/1802345678901",
        "source_platform": "Twitter/X",
        "similarity_score": 0.89,
        "evidence_url": "",
        "ai_analysis": "Partial match detected. A 45-second clip of the UCL Final celebrations appears in this tweet. The clip has been re-encoded and letterboxed, reducing similarity to 89%. Watermark partially degraded but traceable. Likely a fan re-share; recommend DMCA notice via Twitter's media policy portal.",
        "status": "pending",
        "days_ago": 1,
        "severity": "high",
    },
    {
        "id": "demo-vio-003",
        "asset_id": "demo-asset-001",
        "source_url": "https://reddit.com/r/soccer/comments/demo123",
        "source_platform": "Reddit",
        "similarity_score": 0.82,
        "evidence_url": "",
        "ai_analysis": "Moderate similarity detected. Compressed GIF extracted from original broadcast showing the penalty shootout sequence. Similarity at 82% due to heavy compression artifacts and color shift. Consider monitoring before issuing notice.",
        "status": "pending",
        "days_ago": 3,
        "severity": "medium",
    },
    # Wimbledon violations
    {
        "id": "demo-vio-004",
        "asset_id": "demo-asset-002",
        "source_url": "https://www.facebook.com/watch/?v=WimbledonHighlights2024",
        "source_platform": "Facebook",
        "similarity_score": 0.94,
        "evidence_url": "",
        "ai_analysis": "Strong match detected. Facebook page 'Tennis Daily' has uploaded a 6-minute highlight compilation that includes 4 minutes of protected Wimbledon Final footage. Similarity 94%. Watermark WM-WIM-2024-002 confirmed present in frames 1420–2840. Immediate takedown recommended.",
        "status": "confirmed",
        "days_ago": 4,
        "severity": "critical",
    },
    {
        "id": "demo-vio-005",
        "asset_id": "demo-asset-002",
        "source_url": "https://www.dailymotion.com/video/x9tennis2024",
        "source_platform": "Dailymotion",
        "similarity_score": 0.78,
        "evidence_url": "",
        "ai_analysis": "Low-to-moderate match. A 2-minute clip shows Alcaraz's match point. Re-encoded at lower quality (480p vs original 1080p), bringing similarity to 78%. Watermark partially detectable. Recommend issuing notice to Dailymotion DMCA agent.",
        "status": "pending",
        "days_ago": 5,
        "severity": "medium",
    },
    # Olympics violations
    {
        "id": "demo-vio-006",
        "asset_id": "demo-asset-003",
        "source_url": "https://www.tiktok.com/@olympicsfan/video/72890123456789",
        "source_platform": "TikTok",
        "similarity_score": 0.91,
        "evidence_url": "",
        "ai_analysis": "High-confidence match. TikTok video (4.2M views) contains 90 seconds of the Seine River ceremony from the official IOC broadcast. Content has been cropped to portrait (9:16) and background music added. Similarity 91%. IOC watermark WM-OLY-2024-003 detectable in 78% of frames. High-priority takedown given viral reach.",
        "status": "confirmed",
        "days_ago": 6,
        "severity": "critical",
    },
    {
        "id": "demo-vio-007",
        "asset_id": "demo-asset-003",
        "source_url": "https://twitch.tv/videos/demo_stream_olympics",
        "source_platform": "Twitch",
        "similarity_score": 0.96,
        "evidence_url": "",
        "ai_analysis": "Very high similarity. VOD of a Twitch stream that appears to have rebroadcast the Paris 2024 opening ceremony live. Similarity 96%, nearly identical quality to source. Full watermark signature present. File a DMCA via Twitch's designated agent immediately.",
        "status": "confirmed",
        "days_ago": 7,
        "severity": "critical",
    },
    {
        "id": "demo-vio-008",
        "asset_id": "demo-asset-003",
        "source_url": "https://vimeo.com/demo987654321",
        "source_platform": "Vimeo",
        "similarity_score": 0.85,
        "evidence_url": "",
        "ai_analysis": "Moderate-high match. 3-minute Vimeo clip showing drone footage segment from the ceremony. Similarity 85%. Possible editorial use; recommend legal review before issuing takedown.",
        "status": "resolved",
        "days_ago": 10,
        "severity": "high",
    },
]


@router.post("/seed")
def seed_demo_data():
    """
    Load demo assets and violations.
    Safe to call multiple times — skips records that already exist.
    """
    db = get_db()

    # Build set of existing IDs
    existing_assets = {a["id"] for a in (db.table("assets").select("id").execute().data or [])}
    existing_vios = {v["id"] for v in (db.table("violations").select("id").execute().data or [])}

    created_assets = 0
    created_violations = 0
    now = _NOW()

    for a in DEMO_ASSETS:
        if a["id"] in existing_assets:
            continue
        thumbnail = _make_placeholder(a["image_label"], a["image_bg"], a["image_accent"])
        record = {
            "id": a["id"],
            "name": a["name"],
            "description": a["description"],
            "media_type": a["media_type"],
            "original_url": thumbnail,
            "watermarked_url": thumbnail,
            "phash": a["phash"],
            "dhash": a["dhash"],
            "ahash": a["ahash"],
            "watermark_id": a["watermark_id"],
            "organization": a["organization"],
            "tags": a["tags"],
            "status": a["status"],
            "scan_count": a["scan_count"],
            "violation_count": a["violation_count"],
            "created_at": (now - datetime.timedelta(days=14)).isoformat(),
        }
        db.table("assets").insert(record).execute()
        created_assets += 1

    for v in DEMO_VIOLATIONS:
        if v["id"] in existing_vios:
            continue
        detected = now - datetime.timedelta(days=v["days_ago"])
        record = {
            "id": v["id"],
            "asset_id": v["asset_id"],
            "source_url": v["source_url"],
            "source_platform": v["source_platform"],
            "similarity_score": v["similarity_score"],
            "evidence_url": v.get("evidence_url", ""),
            "ai_analysis": v["ai_analysis"],
            "status": v["status"],
            "detected_at": detected.isoformat(),
        }
        db.table("violations").insert(record).execute()
        created_violations += 1

    return {
        "message": "Demo data loaded",
        "assets_created": created_assets,
        "violations_created": created_violations,
        "total_assets": len(DEMO_ASSETS),
        "total_violations": len(DEMO_VIOLATIONS),
    }


@router.delete("/clear")
def clear_demo_data():
    """Remove only demo records (ids starting with 'demo-')."""
    db = get_db()
    all_assets = db.table("assets").select("id").execute().data or []
    all_vios = db.table("violations").select("id").execute().data or []

    removed_assets = 0
    removed_vios = 0
    for v in all_vios:
        if v["id"].startswith("demo-"):
            db.table("violations").delete().eq("id", v["id"]).execute()
            removed_vios += 1
    for a in all_assets:
        if a["id"].startswith("demo-"):
            db.table("assets").delete().eq("id", a["id"]).execute()
            removed_assets += 1

    return {"removed_assets": removed_assets, "removed_violations": removed_vios}
