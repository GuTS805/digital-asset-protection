"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { assetsApi, violationsApi } from "@/lib/api";
import { Asset, Violation } from "@/lib/types";
import { UploadZone } from "@/components/UploadZone";
import { ViolationModal } from "@/components/ViolationCard";
import {
  FolderLock, ScanLine, Trash2, Loader2,
  CheckCircle, Search, Cpu, ShieldCheck,
  AlertTriangle, ChevronRight, ExternalLink
} from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";
import toast from "react-hot-toast";

const SCAN_STEPS = [
  { icon: Search, label: "Searching web for copies…" },
  { icon: Cpu, label: "Comparing fingerprints…" },
  { icon: ShieldCheck, label: "Analyzing with Gemini AI…" },
];

function HashGrid({ phash }: { phash: string }) {
  // Convert hex pHash to an 8x8 binary grid for visualization
  const bits: number[] = [];
  for (let i = 0; i < phash.length && bits.length < 64; i++) {
    const nibble = parseInt(phash[i], 16);
    for (let b = 3; b >= 0; b--) {
      bits.push((nibble >> b) & 1);
    }
  }
  const grid = Array.from({ length: 8 }, (_, r) => bits.slice(r * 8, r * 8 + 8));

  return (
    <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(8, 1fr)" }}>
      {grid.flat().map((bit, i) => (
        <div
          key={i}
          className={clsx("w-3 h-3 rounded-sm", bit ? "bg-blue-500" : "bg-slate-200")}
        />
      ))}
    </div>
  );
}

function ViolationRow({ violation }: { violation: Violation }) {
  const [open, setOpen] = useState(false);
  const pct = Math.round(violation.similarity_score * 100);
  const sev =
    pct >= 95 ? { label: "Critical", dot: "bg-red-500",    text: "text-red-600",    bg: "bg-red-50"    } :
    pct >= 85 ? { label: "High",     dot: "bg-orange-400", text: "text-orange-600", bg: "bg-orange-50" } :
    pct >= 70 ? { label: "Medium",   dot: "bg-amber-400",  text: "text-amber-600",  bg: "bg-amber-50"  } :
                { label: "Low",      dot: "bg-green-500",  text: "text-green-600",  bg: "bg-green-50"  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink-800 transition-colors text-left group"
      >
        <span className={clsx("w-2 h-2 rounded-full shrink-0", sev.dot)} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-txt-primary truncate">{violation.source_platform}</p>
          <p className="text-[10px] text-txt-muted truncate font-mono">{violation.source_url}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={clsx("text-xs font-bold tabular-nums", sev.text)}>{pct}%</span>
          <ChevronRight className="w-3.5 h-3.5 text-txt-muted group-hover:text-brand transition-colors" />
        </div>
      </button>
      {open && <ViolationModal violation={violation} onClose={() => setOpen(false)} />}
    </>
  );
}

function AssetCard({ asset, onScan, onDelete }: {
  asset: Asset;
  onScan: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [scanning, setScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [scanResult, setScanResult] = useState<{ found: number; duration: number } | null>(null);

  const { data: violations, refetch: refetchViolations } = useQuery({
    queryKey: ["violations", "asset", asset.id],
    queryFn: () => violationsApi.list(undefined, asset.id),
    enabled: asset.violation_count > 0,
  });

  const handleScan = async () => {
    setScanning(true);
    setScanResult(null);
    setScanStep(0);
    const interval = setInterval(() => setScanStep((s) => Math.min(s + 1, SCAN_STEPS.length - 1)), 3000);
    try {
      const result = await assetsApi.scan(asset.id);
      setScanResult({ found: result.violations_found, duration: result.scan_duration_seconds });
      if (result.violations_found > 0) {
        toast.error(`${result.violations_found} violation(s) found for "${asset.name}"`);
        refetchViolations();
      } else toast.success(`No new violations found for "${asset.name}"`);
    } catch {
      setScanResult({ found: -1, duration: 0 });
      toast.error("Scan failed — check backend");
    } finally {
      clearInterval(interval);
      setScanning(false);
      setScanStep(0);
    }
  };

  return (
    <div className="card card-hover overflow-hidden">
      <div className="relative h-40 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {asset.original_url && asset.original_url.startsWith("data:") ? (
          <img
            src={asset.original_url}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center">
              <FolderLock className="w-7 h-7 text-brand" />
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-2.5 left-3">
          <span className="text-xs px-2 py-0.5 bg-white/90 text-green-700 border border-green-200 rounded-full capitalize font-semibold">
            {asset.status}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-txt-primary truncate">{asset.name}</h3>
          <p className="text-xs text-txt-muted mt-0.5">{asset.organization}</p>
          {asset.description && <p className="text-xs text-txt-secondary mt-1.5 line-clamp-2">{asset.description}</p>}
        </div>

        {asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.map((tag) => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-ink-600 text-txt-muted border border-line rounded">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Hash grid */}
        <div>
          <p className="text-xs text-txt-muted mb-1.5">Fingerprint (pHash)</p>
          <HashGrid phash={asset.phash} />
          <p className="text-xs text-ink-500 mt-1 font-mono truncate">{asset.phash}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-ink-800 rounded-xl p-3 text-center border border-line">
            <p className="text-lg font-bold text-txt-primary tabular-nums">{asset.scan_count}</p>
            <p className="text-xs text-txt-muted">Scans</p>
          </div>
          <div className={clsx("rounded-xl p-3 text-center border",
            asset.violation_count > 0 ? "bg-red-50 border-red-100" : "bg-ink-800 border-line"
          )}>
            <p className={clsx("text-lg font-bold tabular-nums",
              asset.violation_count > 0 ? "text-red-600" : "text-txt-primary"
            )}>{asset.violation_count}</p>
            <p className="text-xs text-txt-muted">Violations</p>
          </div>
        </div>

        {/* Violations list */}
        {violations && violations.length > 0 && (
          <div className="border border-red-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 bg-red-50 border-b border-red-100">
              <span className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                {violations.length} Active Violation{violations.length !== 1 ? "s" : ""}
              </span>
              <a href="/violations" className="text-[10px] text-brand font-medium hover:underline flex items-center gap-0.5">
                View all <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="divide-y divide-line">
              {violations.slice(0, 3).map((v) => (
                <ViolationRow key={v.id} violation={v} />
              ))}
            </div>
            {violations.length > 3 && (
              <div className="px-3 py-2 bg-ink-800 border-t border-line">
                <a href="/violations" className="text-xs text-brand font-medium hover:underline">
                  +{violations.length - 3} more violation{violations.length - 3 !== 1 ? "s" : ""} →
                </a>
              </div>
            )}
          </div>
        )}

        {/* Scan progress */}
        {scanning && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
            {SCAN_STEPS.map(({ icon: Icon, label }, i) => (
              <div key={i} className={clsx("flex items-center gap-2 text-xs py-0.5",
                i === scanStep ? "text-blue-600 font-medium"
                : i < scanStep ? "text-slate-400 line-through"
                : "text-slate-400"
              )}>
                {i === scanStep ? <Loader2 className="w-3 h-3 animate-spin shrink-0" /> : <Icon className="w-3 h-3 shrink-0" />}
                {label}
              </div>
            ))}
          </div>
        )}

        {/* Scan result banner */}
        {!scanning && scanResult && (
          <div className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium",
            scanResult.found === -1 ? "bg-red-50 text-red-600 border border-red-100"
              : scanResult.found > 0 ? "bg-amber-50 text-amber-700 border border-amber-100"
              : "bg-green-50 text-green-700 border border-green-100"
          )}>
            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
            {scanResult.found === -1 ? "Scan failed — check backend"
              : scanResult.found > 0 ? `${scanResult.found} violation(s) detected`
              : `Clean — no violations (${scanResult.duration}s)`}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-line">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg bg-brand text-white hover:bg-brand-dark transition-colors disabled:opacity-50"
          >
            {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ScanLine className="w-3.5 h-3.5" />}
            {scanning ? "Scanning..." : "Scan Now"}
          </button>
          <button
            onClick={() => onDelete(asset.id)}
            className="p-2 text-txt-muted hover:text-danger-light hover:bg-red-50 rounded-lg transition-colors border border-line"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const [showUpload, setShowUpload] = useState(false);
  const qc = useQueryClient();

  const { data: assets, isLoading } = useQuery({
    queryKey: ["assets"],
    queryFn: assetsApi.list,
  });

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this asset and all its violations?")) return;
    await toast.promise(
      assetsApi.delete(id).then(() => qc.invalidateQueries({ queryKey: ["assets"] })),
      { loading: "Deleting…", success: "Asset deleted", error: "Delete failed" }
    );
  };

  const handleScan = (id: string) => id; // handled inside AssetCard

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-line flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Asset Registry</h1>
          <p className="text-sm text-txt-muted mt-0.5">
            {assets?.length ?? 0} protected asset{assets?.length !== 1 ? "s" : ""} — each continuously monitored
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="btn-primary text-sm flex items-center gap-2"
        >
          <FolderLock className="w-4 h-4" />
          {showUpload ? "Cancel" : "Register Asset"}
        </button>
      </div>

      {/* Upload panel */}
      {showUpload && (
        <div className="card p-8">
          <h2 className="text-txt-primary font-bold text-base mb-6">Register New Asset</h2>
          <UploadZone onSuccess={() => setShowUpload(false)} />
        </div>
      )}

      {/* Asset grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-brand animate-spin" />
        </div>
      ) : assets && assets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onScan={handleScan}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="card p-16 text-center">
          <FolderLock className="w-10 h-10 text-ink-500 mx-auto mb-4" />
          <h3 className="text-txt-primary font-semibold mb-1">No assets registered</h3>
          <p className="text-txt-muted text-sm mb-5">Upload your first asset to begin monitoring.</p>
          <button
            onClick={() => setShowUpload(true)}
            className="btn-primary text-sm"
          >
            Register Your First Asset
          </button>
        </div>
      )}
    </div>
  );
}
