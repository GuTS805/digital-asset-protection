"""
Web crawler that searches for unauthorized copies of registered assets.

Uses Google Custom Search API (100 free queries/day) for image search.
For each asset, it searches using asset name + sports keywords,
then downloads found images and runs fingerprint comparison.
"""

import os
import json
import requests
import httpx
import asyncio
from datetime import date
from typing import Optional
import logging

logger = logging.getLogger(__name__)

GOOGLE_SEARCH_API_KEY = os.getenv("GOOGLE_SEARCH_API_KEY", "")
GOOGLE_SEARCH_ENGINE_ID = os.getenv("GOOGLE_SEARCH_ENGINE_ID", "")
SEARCH_BASE_URL = "https://www.googleapis.com/customsearch/v1"
DAILY_QUOTA = 90  # stay under Google's 100/day free limit

_QUOTA_FILE = os.path.join(os.path.dirname(__file__), "../data/api_quota.json")


def _get_quota() -> dict:
    try:
        with open(_QUOTA_FILE) as f:
            data = json.load(f)
        if data.get("date") != str(date.today()):
            return {"date": str(date.today()), "count": 0}
        return data
    except Exception:
        return {"date": str(date.today()), "count": 0}


def _increment_quota():
    quota = _get_quota()
    quota["count"] += 1
    os.makedirs(os.path.dirname(_QUOTA_FILE), exist_ok=True)
    with open(_QUOTA_FILE, "w") as f:
        json.dump(quota, f)

KNOWN_PLATFORMS = [
    "twitter.com", "x.com", "instagram.com", "facebook.com",
    "reddit.com", "tiktok.com", "youtube.com", "pinterest.com",
    "tumblr.com", "imgur.com", "flickr.com",
]


def _detect_platform(url: str) -> str:
    for platform in KNOWN_PLATFORMS:
        if platform in url:
            return platform.replace(".com", "").replace("x.com", "twitter").title()
    return "Unknown"


def search_for_asset(
    asset_name: str,
    organization: str,
    num_results: int = 10,
) -> list[dict]:
    """
    Search Google for copies of the asset. Returns list of candidate URLs.
    """
    if not GOOGLE_SEARCH_API_KEY or not GOOGLE_SEARCH_ENGINE_ID:
        logger.warning("Google Search API not configured — using mock results")
        return _mock_search_results(asset_name)

    quota = _get_quota()
    if quota["count"] >= DAILY_QUOTA:
        logger.warning(f"Daily search quota reached ({quota['count']}/{DAILY_QUOTA}) — skipping API call")
        return []

    query = f'"{asset_name}" {organization} sports media'
    params = {
        "key": GOOGLE_SEARCH_API_KEY,
        "cx": GOOGLE_SEARCH_ENGINE_ID,
        "q": query,
        "searchType": "image",
        "num": min(num_results, 10),
        "safe": "active",
    }

    try:
        response = requests.get(SEARCH_BASE_URL, params=params, timeout=10)
        response.raise_for_status()
        _increment_quota()
        data = response.json()

        results = []
        for item in data.get("items", []):
            results.append(
                {
                    "url": item.get("link", ""),
                    "title": item.get("title", ""),
                    "context_url": item.get("image", {}).get("contextLink", ""),
                    "platform": _detect_platform(item.get("link", "")),
                    "thumbnail": item.get("image", {}).get("thumbnailLink", ""),
                }
            )
        return results
    except Exception as e:
        logger.error(f"Google Search error: {e}")
        return []


def fetch_image(url: str, timeout: int = 8) -> Optional[bytes]:
    """Download image bytes from URL for fingerprint comparison."""
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (compatible; AssetProtectionBot/1.0)"
        }
        response = requests.get(url, headers=headers, timeout=timeout, stream=True)
        content_type = response.headers.get("content-type", "")
        if "image" not in content_type:
            return None
        return response.content
    except Exception as e:
        logger.warning(f"Failed to fetch image from {url}: {e}")
        return None


def _mock_search_results(asset_name: str) -> list[dict]:
    """Return deterministic mock results when API key not configured."""
    return [
        {
            "url": f"https://example-sports.com/stolen/{asset_name.replace(' ', '-')}.jpg",
            "title": f"[Mock] Unauthorized: {asset_name}",
            "context_url": "https://example-sports.com",
            "platform": "Example Sports",
            "thumbnail": "",
        },
        {
            "url": f"https://reddit.com/r/sports/mock-{asset_name[:10]}",
            "title": f"[Mock] Reddit post: {asset_name}",
            "context_url": "https://reddit.com",
            "platform": "Reddit",
            "thumbnail": "",
        },
    ]
