export interface Asset {
  id: string;
  name: string;
  description?: string;
  media_type: "image" | "video" | "audio";
  original_url: string;
  watermarked_url?: string;
  phash: string;
  dhash: string;
  ahash: string;
  watermark_id: string;
  organization: string;
  tags: string[];
  status: "active" | "monitoring" | "archived";
  scan_count: number;
  violation_count: number;
  created_at: string;
}

export interface Violation {
  id: string;
  asset_id: string;
  asset_name?: string;
  source_url: string;
  source_platform: string;
  detected_at: string;
  similarity_score: number;
  status: "pending" | "confirmed" | "resolved" | "false_positive";
  evidence_url?: string;
  ai_analysis?: string;
}

export interface DashboardStats {
  total_assets: number;
  active_violations: number;
  scans_today: number;
  protected_content_gb: number;
  violation_trend: { date: string; violations: number }[];
  platform_breakdown: { platform: string; count: number }[];
  recent_violations: Violation[];
  severity_breakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export interface ScanResult {
  asset_id: string;
  candidates_checked: number;
  violations_found: number;
  scan_duration_seconds: number;
}
