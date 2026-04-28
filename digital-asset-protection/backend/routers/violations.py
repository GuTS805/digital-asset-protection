import datetime
import os
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import PlainTextResponse
from typing import Optional
from database import get_db
from models.schemas import ViolationResponse

router = APIRouter()


@router.get("/", response_model=list[ViolationResponse])
def list_violations(
    status: Optional[str] = None,
    asset_id: Optional[str] = None,
    limit: int = Query(50, le=200),
):
    db = get_db()
    query = (
        db.table("violations")
        .select("*, assets(name)")
        .order("detected_at", desc=True)
        .limit(limit)
    )
    if status:
        query = query.eq("status", status)
    if asset_id:
        query = query.eq("asset_id", asset_id)

    result = query.execute()
    violations = []
    for v in result.data or []:
        asset_name = None
        if v.get("assets"):
            asset_name = v["assets"].get("name")
        violations.append(
            ViolationResponse(
                id=v["id"],
                asset_id=v["asset_id"],
                asset_name=asset_name,
                source_url=v["source_url"],
                source_platform=v.get("source_platform", "Unknown"),
                detected_at=v["detected_at"],
                similarity_score=v.get("similarity_score", 0.0),
                status=v.get("status", "pending"),
                evidence_url=v.get("evidence_url"),
                ai_analysis=v.get("ai_analysis"),
            )
        )
    return violations


@router.get("/{violation_id}", response_model=ViolationResponse)
def get_violation(violation_id: str):
    db = get_db()
    result = (
        db.table("violations")
        .select("*, assets(name)")
        .eq("id", violation_id)
        .single()
        .execute()
    )
    if not result.data:
        raise HTTPException(404, "Violation not found")
    v = result.data
    return ViolationResponse(
        id=v["id"],
        asset_id=v["asset_id"],
        asset_name=v.get("assets", {}).get("name") if v.get("assets") else None,
        source_url=v["source_url"],
        source_platform=v.get("source_platform", "Unknown"),
        detected_at=v["detected_at"],
        similarity_score=v.get("similarity_score", 0.0),
        status=v.get("status", "pending"),
        evidence_url=v.get("evidence_url"),
        ai_analysis=v.get("ai_analysis"),
    )


@router.patch("/{violation_id}/status")
def update_violation_status(violation_id: str, status: str):
    valid = {"pending", "confirmed", "resolved", "false_positive"}
    if status not in valid:
        raise HTTPException(400, f"Status must be one of: {valid}")
    db = get_db()
    db.table("violations").update({"status": status}).eq("id", violation_id).execute()
    return {"message": f"Violation {violation_id} marked as {status}"}


@router.post("/{violation_id}/dmca", response_class=PlainTextResponse)
def generate_dmca_letter(violation_id: str):
    db = get_db()
    result = db.table("violations").select("*, assets(name)").eq("id", violation_id).single().execute()
    if not result.data:
        raise HTTPException(404, "Violation not found")
    v = result.data
    asset_name = (v.get("assets") or {}).get("name", "Unknown Asset")
    org = os.getenv("ADMIN_USERNAME", "Rights Holder")
    url = v.get("source_url", "")
    platform = v.get("source_platform", "Unknown Platform")
    score = v.get("similarity_score", 0)
    detected = v.get("detected_at", "")[:10]

    try:
        import google.generativeai as genai
        api_key = os.getenv("GEMINI_API_KEY", "")
        if api_key:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"""Write a formal DMCA takedown notice letter for the following violation:
- Asset: {asset_name}
- Rights holder / Organization: {org}
- Infringing URL: {url}
- Platform: {platform}
- Similarity score: {score:.1%}
- Detection date: {detected}

The letter should:
1. Be professional and legally appropriate
2. Cite the DMCA Section 512(c) safe harbor provisions
3. Include all required DMCA elements (identification of work, infringing material, contact, good faith statement, accuracy statement)
4. Be ready to send to the platform's designated DMCA agent
5. Use [YOUR NAME], [YOUR EMAIL], [YOUR ADDRESS] as placeholders for personal info

Output only the letter text, no preamble."""
            response = model.generate_content(prompt)
            return response.text.strip()
    except Exception:
        pass

    return f"""DMCA TAKEDOWN NOTICE

Date: {datetime.date.today().isoformat()}

To the Designated DMCA Agent of {platform},

RE: Notice of Copyright Infringement under 17 U.S.C. § 512(c)

I, [YOUR NAME], am the authorized representative of the copyright holder for the work described below.

COPYRIGHTED WORK:
"{asset_name}" — original sports media asset registered and protected by ShieldSync Digital Asset Protection system.

INFRINGING MATERIAL:
URL: {url}
Platform: {platform}
Detection Date: {detected}
Similarity Score: {score:.1%} (automated perceptual fingerprint match)

I have a good faith belief that the use of the copyrighted material described above is not authorized by the copyright owner, its agent, or the law.

The information in this notice is accurate, and under penalty of perjury, I am authorized to act on behalf of the owner of the exclusive rights that are allegedly infringed.

I request that you immediately remove or disable access to the infringing material.

Sincerely,
[YOUR NAME]
[YOUR EMAIL]
[YOUR ADDRESS]
[YOUR PHONE]
"""


@router.get("/stats/summary")
def violation_stats():
    db = get_db()
    all_v = db.table("violations").select("status,source_platform,detected_at").execute()
    data = all_v.data or []

    by_status = {}
    by_platform = {}
    for v in data:
        s = v.get("status", "pending")
        by_status[s] = by_status.get(s, 0) + 1
        p = v.get("source_platform", "Unknown")
        by_platform[p] = by_platform.get(p, 0) + 1

    return {
        "total": len(data),
        "by_status": by_status,
        "by_platform": sorted(
            [{"platform": k, "count": v} for k, v in by_platform.items()],
            key=lambda x: x["count"],
            reverse=True,
        ),
    }
