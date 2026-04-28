from pydantic import BaseModel, Field
from typing import Optional, List
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
    description: Optional[str]
    media_type: str
    original_url: str
    watermarked_url: Optional[str]
    phash: str
    dhash: str
    ahash: str
    watermark_id: str
    organization: str
    tags: List[str]
    status: str
    scan_count: int
    violation_count: int
    created_at: str


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
    asset_name: Optional[str]
    source_url: str
    source_platform: str
    detected_at: str
    similarity_score: float
    status: str
    evidence_url: Optional[str]
    ai_analysis: Optional[str]


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
