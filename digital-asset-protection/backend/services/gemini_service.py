"""
Google Gemini AI service for intelligent content analysis.

Uses gemini-1.5-flash (free tier: 15 RPM, 1M TPM/day) to:
1. Analyze whether found content is official vs unauthorized
2. Assess context of usage (news, parody, commercial, redistribution)
3. Generate violation severity ratings
4. Suggest takedown justification text
"""

import os
import google.generativeai as genai
from PIL import Image
import io
import logging

logger = logging.getLogger(__name__)

_model = None


def _get_model():
    global _model
    if _model is None:
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            return None
        genai.configure(api_key=api_key)
        _model = genai.GenerativeModel("gemini-1.5-flash")
    return _model


def analyze_violation(
    original_image_data: bytes,
    found_url: str,
    asset_name: str,
    organization: str,
    similarity_score: float,
) -> dict:
    """
    Use Gemini to analyze a potential violation and return structured assessment.
    """
    model = _get_model()
    if not model:
        return _mock_analysis(similarity_score)

    try:
        img = Image.open(io.BytesIO(original_image_data))

        prompt = f"""You are a digital rights enforcement specialist for sports media.

Analyze this original registered asset:
- Asset Name: {asset_name}
- Rights Holder: {organization}
- Perceptual similarity score to found content: {similarity_score:.1%}
- Found at URL: {found_url}

Based on the image provided and context, assess:
1. Severity: CRITICAL (direct commercial redistribution) | HIGH (social viral spread) | MEDIUM (blog/news embed) | LOW (commentary/parody)
2. Usage type: redistribution | embedding | screenshot | derivative_work | parody | news_fair_use
3. Takedown justified: true/false
4. Confidence in violation: 0-100
5. Brief legal basis for takedown (1 sentence)

Respond in this exact JSON format:
{{
  "severity": "HIGH",
  "usage_type": "redistribution",
  "takedown_justified": true,
  "confidence": 87,
  "legal_basis": "Unauthorized commercial redistribution of copyrighted sports photography violates exclusive licensing rights.",
  "summary": "Image appears to be directly redistributed without attribution or license."
}}"""

        response = model.generate_content([prompt, img])
        text = response.text.strip()

        import json, re
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        return _mock_analysis(similarity_score)

    except Exception as e:
        logger.error(f"Gemini analysis error: {e}")
        return _mock_analysis(similarity_score)


def analyze_asset_content(image_data: bytes) -> dict:
    """
    Analyze uploaded asset to confirm it's legitimate sports media
    and extract metadata (sport type, event type, etc.).
    """
    model = _get_model()
    if not model:
        return {"sport": "Unknown", "content_type": "sports_media", "is_valid": True}

    try:
        img = Image.open(io.BytesIO(image_data))
        prompt = """Analyze this sports media image and respond in JSON:
{
  "sport": "football/basketball/cricket/etc",
  "content_type": "match_photo/highlight_reel/infographic/broadcast_still/logo",
  "is_valid_sports_content": true,
  "has_existing_watermark": false,
  "estimated_value": "high/medium/low",
  "tags": ["list", "of", "relevant", "tags"]
}"""
        response = model.generate_content([prompt, img])
        import json, re
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
    except Exception as e:
        logger.error(f"Asset analysis error: {e}")

    return {"sport": "Unknown", "content_type": "sports_media", "is_valid_sports_content": True}


def _mock_analysis(similarity_score: float) -> dict:
    severity = "CRITICAL" if similarity_score > 0.95 else "HIGH" if similarity_score > 0.85 else "MEDIUM"
    return {
        "severity": severity,
        "usage_type": "redistribution",
        "takedown_justified": similarity_score > 0.80,
        "confidence": int(similarity_score * 100),
        "legal_basis": "Unauthorized redistribution of copyrighted sports media without license.",
        "summary": f"High similarity ({similarity_score:.1%}) detected — likely unauthorized copy.",
    }
