"use client";

import { useQuery } from "@tanstack/react-query";
import { violationsApi } from "@/lib/api";
import { ViolationCard } from "@/components/ViolationCard";
import { Loader2, AlertTriangle, Filter, Download } from "lucide-react";
import { useState } from "react";
import { clsx } from "clsx";
import toast from "react-hot-toast";

function exportCSV(violations: any[]) {
  const headers = ["ID", "Asset", "Source URL", "Platform", "Similarity %", "Status", "Detected At"];
  const rows = violations.map((v) => [
    v.id, v.asset_name ?? "", v.source_url, v.source_platform,
    (v.similarity_score * 100).toFixed(1), v.status,
    new Date(v.detected_at).toLocaleString(),
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c: any) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `violations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
  toast.success("CSV exported successfully");
}

const STATUS_FILTERS = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "resolved", label: "Resolved" },
  { key: "false_positive", label: "False Positive" },
];

export default function ViolationsPage() {
  const [activeFilter, setActiveFilter] = useState("");

  const { data: violations, isLoading } = useQuery({
    queryKey: ["violations", activeFilter],
    queryFn: () => violationsApi.list(activeFilter || undefined),
    refetchInterval: 30_000,
  });

  const counts = {
    pending: violations?.filter((v) => v.status === "pending").length ?? 0,
    confirmed: violations?.filter((v) => v.status === "confirmed").length ?? 0,
    critical: violations?.filter((v) => v.similarity_score > 0.95).length ?? 0,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-line flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Violations</h1>
          <p className="text-sm text-txt-muted mt-0.5">Detected unauthorized uses of your protected media</p>
        </div>
        {violations && violations.length > 0 && (
          <button onClick={() => exportCSV(violations)} className="btn-ghost text-xs flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        )}
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Pending", value: counts.pending, bar: "stat-bar-red" },
          { label: "Confirmed", value: counts.confirmed, bar: "stat-bar-red" },
          { label: "Critical", value: counts.critical, bar: "stat-bar-red" },
          { label: "Total", value: violations?.length ?? 0, bar: "stat-bar-blue" },
        ].map(({ label, value, bar }) => (
          <div key={label} className={`card pl-4 pr-5 py-4 ${bar}`}>
            <p className="text-xl font-bold text-txt-primary tabular-nums">{value}</p>
            <p className="text-xs text-txt-muted mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-txt-muted" />
        {STATUS_FILTERS.map(({ key, label }) => (
          <button key={key} onClick={() => setActiveFilter(key)}
            className={clsx("px-3 py-1 rounded text-xs font-medium transition-colors border",
              activeFilter === key ? "bg-brand text-white border-brand" : "text-txt-secondary border-line hover:text-txt-primary hover:border-line-light"
            )}>
            {label}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 text-brand animate-spin" /></div>
      ) : violations && violations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {violations.map((v) => <ViolationCard key={v.id} violation={v} />)}
        </div>
      ) : (
        <div className="card p-16 text-center">
          <AlertTriangle className="w-8 h-8 text-ink-500 mx-auto mb-3" />
          <h3 className="text-txt-primary font-semibold mb-1">
            {activeFilter ? `No ${activeFilter} violations` : "No violations detected"}
          </h3>
          <p className="text-txt-muted text-sm">
            {activeFilter ? "Try a different filter." : "Content is clean — or no scans have run yet."}
          </p>
        </div>
      )}
    </div>
  );
}
