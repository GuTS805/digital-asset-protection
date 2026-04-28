"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { assetsApi } from "@/lib/api";
import { Asset } from "@/lib/types";
import { UploadZone } from "@/components/UploadZone";
import {
  FolderLock, ScanLine, Trash2, Loader2,
  RefreshCw, CheckCircle, Search, Cpu, ShieldCheck
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
          className={clsx("w-3 h-3 rounded-sm", bit ? "bg-blue-400" : "bg-slate-800")}
        />
      ))}
    </div>
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

  const handleScan = async () => {
    setScanning(true);
    setScanResult(null);
    setScanStep(0);
    const interval = setInterval(() => setScanStep((s) => Math.min(s + 1, SCAN_STEPS.length - 1)), 3000);
    try {
      const result = await assetsApi.scan(asset.id);
      setScanResult({ found: result.violations_found, duration: result.scan_duration_seconds });
      if (result.violations_found > 0) toast.error(`${result.violations_found} violation(s) found for "${asset.name}"`);
      else toast.success(`No violations found for "${asset.name}"`);
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
      {asset.original_url && (
        <div className="relative h-36 bg-ink-700 overflow-hidden">
          <img src={asset.original_url} alt={asset.name}
            className="w-full h-full object-cover opacity-70"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-800/90 to-transparent" />
          <div className="absolute bottom-2.5 left-3">
            <span className="text-xs px-2 py-0.5 bg-safe/15 text-safe-light border border-safe/25 rounded capitalize font-medium">
              {asset.status}
            </span>
          </div>
        </div>
      )}

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
          <div className="bg-ink-700 rounded p-3 text-center">
            <p className="text-lg font-bold text-txt-primary tabular-nums">{asset.scan_count}</p>
            <p className="text-xs text-txt-muted">Scans</p>
          </div>
          <div className="bg-ink-700 rounded p-3 text-center">
            <p className="text-lg font-bold text-danger-light tabular-nums">{asset.violation_count}</p>
            <p className="text-xs text-txt-muted">Violations</p>
          </div>
        </div>

        {/* Scan progress */}
        {scanning && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
            {SCAN_STEPS.map(({ icon: Icon, label }, i) => (
              <div key={i} className={clsx("flex items-center gap-2 text-xs py-0.5", i === scanStep ? "text-blue-400" : i < scanStep ? "text-slate-500 line-through" : "text-slate-600")}>
                {i === scanStep ? <Loader2 className="w-3 h-3 animate-spin shrink-0" /> : <Icon className="w-3 h-3 shrink-0" />}
                {label}
              </div>
            ))}
          </div>
        )}

        {/* Scan result banner */}
        {!scanning && scanResult && (
          <div className={clsx(
            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
            scanResult.found === -1 ? "bg-red-500/10 text-red-400"
              : scanResult.found > 0 ? "bg-amber-500/10 text-amber-400"
              : "bg-green-500/10 text-green-400"
          )}>
            <CheckCircle className="w-4 h-4 shrink-0" />
            {scanResult.found === -1 ? "Scan failed — check backend"
              : scanResult.found > 0 ? `${scanResult.found} new violation(s) found`
              : `Clean — no violations (${scanResult.duration}s)`}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-slate-700/50">
          <button
            onClick={handleScan}
            disabled={scanning}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
          >
            {scanning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ScanLine className="w-3.5 h-3.5" />
            )}
            {scanning ? "Scanning..." : "Scan Now"}
          </button>
          <button
            onClick={() => onDelete(asset.id)}
            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
