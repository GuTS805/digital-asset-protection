"""
Background scheduler that automatically scans all active assets
for unauthorized copies every 6 hours.
"""

import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

logger = logging.getLogger(__name__)
_scheduler: BackgroundScheduler | None = None


def _run_scheduled_scan():
    """Triggered by APScheduler — scans all active assets."""
    try:
        from database import get_db
        from services.fingerprinting import generate_fingerprint, is_similar
        from services.crawler import search_for_asset, fetch_image
        from services.gemini_service import analyze_violation
        import datetime

        db = get_db()
        assets = db.table("assets").select("*").eq("status", "monitoring").execute()

        for asset in assets.data or []:
            try:
                candidates = search_for_asset(asset["name"], asset.get("organization", ""))
                for candidate in candidates:
                    image_bytes = fetch_image(candidate["url"])
                    if not image_bytes:
                        continue

                    fp = generate_fingerprint(image_bytes)
                    if not is_similar(asset["phash"], fp["phash"], asset["dhash"], fp["dhash"]):
                        continue

                    from services.fingerprinting import similarity_score
                    score = similarity_score(asset["phash"], fp["phash"])

                    # Avoid duplicate violations
                    existing = (
                        db.table("violations")
                        .select("id")
                        .eq("asset_id", asset["id"])
                        .eq("source_url", candidate["url"])
                        .execute()
                    )
                    if existing.data:
                        continue

                    analysis = analyze_violation(
                        b"",  # skip re-download in scheduler for speed
                        candidate["url"],
                        asset["name"],
                        asset.get("organization", ""),
                        score,
                    )

                    db.table("violations").insert(
                        {
                            "asset_id": asset["id"],
                            "source_url": candidate["url"],
                            "source_platform": candidate["platform"],
                            "similarity_score": score,
                            "evidence_url": candidate.get("thumbnail", ""),
                            "ai_analysis": str(analysis),
                            "status": "pending",
                            "detected_at": datetime.datetime.utcnow().isoformat(),
                        }
                    ).execute()

                # Update scan count
                db.table("assets").update(
                    {"scan_count": asset.get("scan_count", 0) + 1}
                ).eq("id", asset["id"]).execute()

            except Exception as e:
                logger.error(f"Error scanning asset {asset.get('id')}: {e}")

    except Exception as e:
        logger.error(f"Scheduled scan failed: {e}")


def start_scheduler():
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = BackgroundScheduler()
    _scheduler.add_job(
        _run_scheduled_scan,
        trigger=IntervalTrigger(hours=6),
        id="asset_scan",
        name="Asset violation scan",
        replace_existing=True,
    )
    _scheduler.start()
    logger.info("Background scheduler started — scanning every 6 hours")


def stop_scheduler():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown()
        _scheduler = None
