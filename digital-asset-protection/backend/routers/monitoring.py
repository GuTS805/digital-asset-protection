import datetime
from fastapi import APIRouter
from database import get_db

router = APIRouter()


@router.get("/dashboard")
def dashboard_stats():
    db = get_db()

    assets = db.table("assets").select("id,status,created_at").execute()
    violations = db.table("violations").select("id,status,source_platform,detected_at,similarity_score").execute()

    asset_data = assets.data or []
    violation_data = violations.data or []

    total_assets = len(asset_data)
    active_violations = sum(1 for v in violation_data if v["status"] == "pending")

    today = datetime.date.today().isoformat()
    scans_today = sum(
        1 for a in asset_data if a.get("created_at", "").startswith(today)
    )

    # Violations per day (last 7 days)
    trend = {}
    for i in range(7):
        day = (datetime.date.today() - datetime.timedelta(days=i)).isoformat()
        trend[day] = 0
    for v in violation_data:
        day = v.get("detected_at", "")[:10]
        if day in trend:
            trend[day] += 1

    violation_trend = [
        {"date": k, "violations": v}
        for k, v in sorted(trend.items())
    ]

    # Platform breakdown
    platform_counts: dict[str, int] = {}
    for v in violation_data:
        p = v.get("source_platform", "Unknown")
        platform_counts[p] = platform_counts.get(p, 0) + 1

    platform_breakdown = sorted(
        [{"platform": k, "count": v} for k, v in platform_counts.items()],
        key=lambda x: x["count"],
        reverse=True,
    )[:6]

    # Recent violations (last 5)
    recent = sorted(violation_data, key=lambda v: v.get("detected_at", ""), reverse=True)[:5]

    return {
        "total_assets": total_assets,
        "active_violations": active_violations,
        "scans_today": scans_today,
        "protected_content_gb": round(total_assets * 0.08, 2),
        "violation_trend": violation_trend,
        "platform_breakdown": platform_breakdown,
        "recent_violations": recent,
        "severity_breakdown": {
            "critical": sum(1 for v in violation_data if v.get("similarity_score", 0) > 0.95),
            "high": sum(1 for v in violation_data if 0.85 < v.get("similarity_score", 0) <= 0.95),
            "medium": sum(1 for v in violation_data if 0.70 < v.get("similarity_score", 0) <= 0.85),
            "low": sum(1 for v in violation_data if v.get("similarity_score", 0) <= 0.70),
        },
    }


@router.get("/activity")
def recent_activity():
    db = get_db()
    violations = (
        db.table("violations")
        .select("*, assets(name)")
        .order("detected_at", desc=True)
        .limit(20)
        .execute()
    )
    return violations.data or []
