from pydantic import BaseModel, Field, validator
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


class MediaType(str, Enum):
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"


class AssetStatus(str, Enum):
    ACTIVE = "active"
    MONITORING = "monitoring"
    ARCHIVED = "archived"


class ViolationStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    RESOLVED = "resolved"
    FALSE_POSITIVE = "false_positive"


class AssetCreate(BaseModel):
    name: str
    description: Optional[str] = None
    media_type: MediaType = MediaType.IMAGE
    organization: str = "Default Org"
    tags: List[str] = []


class AssetResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    media_type: str = "image"
    original_url: str = ""
    watermarked_url: Optional[str] = None
    phash: str = ""
    dhash: str = ""
    ahash: str = ""
    watermark_id: str = ""
    organization: str = ""
    tags: List[str] = []
    status: str = "monitoring"
    scan_count: int = 0
    violation_count: int = 0
    created_at: str = ""

    @validator("tags", pre=True, always=True)
    def coerce_tags(cls, v):
        if v is None:
            return []
        if isinstance(v, list):
            return [str(t) for t in v]
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except Exception:
                return [v] if v else []
        return []

    @validator("created_at", pre=True, always=True)
    def coerce_created_at(cls, v):
        if v is None:
            return ""
        if isinstance(v, datetime):
            return v.isoformat()
        return str(v)


class ViolationCreate(BaseModel):
    asset_id: str
    source_url: str
    source_platform: str
    similarity_score: float
    evidence_url: Optional[str] = None
    ai_analysis: Optional[str] = None


class ViolationResponse(BaseModel):
    id: str
    asset_id: str
    asset_name: Optional[str] = None
    source_url: str = ""
    source_platform: str = "Unknown"
    detected_at: str = ""
    similarity_score: float = 0.0
    status: str = "pending"
    evidence_url: Optional[str] = None
    ai_analysis: Optional[str] = None

    @validator("detected_at", pre=True, always=True)
    def coerce_detected_at(cls, v):
        if v is None:
            return ""
        if isinstance(v, datetime):
            return v.isoformat()
        return str(v)


class ScanResult(BaseModel):
    asset_id: str
    matches_found: int
    scan_duration_seconds: float
    violations: List[ViolationCreate]


class DashboardStats(BaseModel):
    total_assets: int
    active_violations: int
    scans_today: int
    protected_content_gb: float
    violation_trend: List[dict]
    platform_breakdown: List[dict]
    recent_violations: List[ViolationResponse]


class FingerprintResult(BaseModel):
    phash: str
    dhash: str
    ahash: str
    whash: str
    hamming_distances: Optional[dict] = None
