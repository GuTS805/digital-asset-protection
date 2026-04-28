import uuid
import datetime
import io
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import Response
from typing import Optional
from database import get_db
from models.schemas import AssetResponse, FingerprintResult
from services.fingerprinting import generate_fingerprint, generate_hash_grid
from services.watermarking import embed_watermark, extract_watermark, generate_watermark_id
from services.gemini_service import analyze_asset_content

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_SIZE_MB = 20


@router.post("/upload", response_model=AssetResponse)
async def upload_asset(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(""),
    organization: str = Form("Default Org"),
    tags: str = Form(""),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"Unsupported file type: {file.content_type}")

    image_data = await file.read()
    if len(image_data) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"File exceeds {MAX_SIZE_MB}MB limit")

    fingerprint = generate_fingerprint(image_data)
    watermark_id = generate_watermark_id(name, organization)

    try:
        watermarked_data = embed_watermark(image_data, watermark_id)
    except Exception:
        watermarked_data = image_data  # fall back to original if watermark fails

    asset_id = str(uuid.uuid4())

    db = get_db()

    # Upload original to Supabase Storage
    original_path = f"assets/{asset_id}/original.png"
    watermarked_path = f"assets/{asset_id}/watermarked.png"

    import base64
    try:
        db.storage.from_("media").upload(original_path, image_data)
        db.storage.from_("media").upload(watermarked_path, watermarked_data)
        original_url = db.storage.from_("media").get_public_url(original_path)
        watermarked_url = db.storage.from_("media").get_public_url(watermarked_path)
    except Exception:
        mime = file.content_type or "image/png"
        original_url = f"data:{mime};base64,{base64.b64encode(image_data).decode()}"
        watermarked_url = f"data:{mime};base64,{base64.b64encode(watermarked_data).decode()}"

    tag_list = [t.strip() for t in tags.split(",") if t.strip()]

    asset_record = {
        "id": asset_id,
        "name": name,
        "description": description,
        "media_type": "image",
        "original_url": original_url,
        "watermarked_url": watermarked_url,
        "phash": fingerprint["phash"],
        "dhash": fingerprint["dhash"],
        "ahash": fingerprint["ahash"],
        "watermark_id": watermark_id,
        "organization": organization,
        "tags": tag_list,
        "status": "monitoring",
        "scan_count": 0,
        "violation_count": 0,
        "created_at": datetime.datetime.utcnow().isoformat(),
    }

    db.table("assets").insert(asset_record).execute()

    return AssetResponse(**asset_record)


@router.get("/", response_model=list[AssetResponse])
def list_assets(organization: Optional[str] = None):
    db = get_db()
    query = db.table("assets").select("*").order("created_at", desc=True)
    if organization:
        query = query.eq("organization", organization)
    result = query.execute()
    return [AssetResponse(**a) for a in (result.data or [])]


@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: str):
    db = get_db()
    result = db.table("assets").select("*").eq("id", asset_id).single().execute()
    if not result.data:
        raise HTTPException(404, "Asset not found")
    return AssetResponse(**result.data)


@router.get("/{asset_id}/fingerprint", response_model=FingerprintResult)
def get_fingerprint(asset_id: str):
    db = get_db()
    result = db.table("assets").select("phash,dhash,ahash").eq("id", asset_id).single().execute()
    if not result.data:
        raise HTTPException(404, "Asset not found")
    data = result.data
    return FingerprintResult(
        phash=data["phash"],
        dhash=data["dhash"],
        ahash=data["ahash"],
        whash=data.get("whash", data["phash"]),
    )


@router.post("/{asset_id}/scan")
async def trigger_scan(asset_id: str):
    """Manually trigger a scan for a specific asset."""
    import time
    from services.crawler import search_for_asset, fetch_image
    from services.fingerprinting import is_similar, similarity_score
    from services.gemini_service import analyze_violation

    db = get_db()
    asset_result = db.table("assets").select("*").eq("id", asset_id).single().execute()
    if not asset_result.data:
        raise HTTPException(404, "Asset not found")

    asset = asset_result.data
    start = time.time()
    candidates = search_for_asset(asset["name"], asset.get("organization", ""))
    violations_found = 0

    for candidate in candidates:
        image_bytes = fetch_image(candidate["url"])
        if not image_bytes:
            continue
        try:
            fp = generate_fingerprint(image_bytes)
            if not is_similar(asset["phash"], fp["phash"], asset["dhash"], fp["dhash"]):
                continue

            score = similarity_score(asset["phash"], fp["phash"])

            existing = (
                db.table("violations")
                .select("id")
                .eq("asset_id", asset_id)
                .eq("source_url", candidate["url"])
                .execute()
            )
            if existing.data:
                continue

            analysis = analyze_violation(
                image_bytes, candidate["url"], asset["name"],
                asset.get("organization", ""), score
            )

            db.table("violations").insert(
                {
                    "id": str(uuid.uuid4()),
                    "asset_id": asset_id,
                    "source_url": candidate["url"],
                    "source_platform": candidate["platform"],
                    "similarity_score": score,
                    "evidence_url": candidate.get("thumbnail", ""),
                    "ai_analysis": str(analysis),
                    "status": "pending",
                    "detected_at": datetime.datetime.utcnow().isoformat(),
                }
            ).execute()
            violations_found += 1
        except Exception:
            continue

    db.table("assets").update(
        {"scan_count": asset.get("scan_count", 0) + 1}
    ).eq("id", asset_id).execute()

    return {
        "asset_id": asset_id,
        "candidates_checked": len(candidates),
        "violations_found": violations_found,
        "scan_duration_seconds": round(time.time() - start, 2),
    }


@router.delete("/{asset_id}")
def delete_asset(asset_id: str):
    db = get_db()
    db.table("assets").delete().eq("id", asset_id).execute()
    return {"message": "Asset deleted"}
