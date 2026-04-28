"use client";

import { Violation } from "@/lib/types";
import { ExternalLink, CheckCircle, XCircle, AlertCircle, Clock, FileText, Copy, X, Loader2 } from "lucide-react";
import { clsx } from "clsx";
import { violationsApi, dmcaApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";

const statusConfig = {
  pending: { label: "Pending", icon: Clock, color: "badge-pending" },
  confirmed: { label: "Confirmed", icon: AlertCircle, color: "badge-confirmed" },
  resolved: { label: "Resolved", icon: CheckCircle, color: "badge-resolved" },
  false_positive: { label: "False Positive", icon: XCircle, color: "badge-false_positive" },
};

function severityFromScore(score: number) {
  if (score > 0.95) return { label: "Critical", color: "text-danger-light bg-danger/10 border-danger/30" };
  if (score > 0.85) return { label: "High",     color: "text-orange-400 bg-orange-500/10 border-orange-500/30" };
  if (score > 0.70) return { label: "Medium",   color: "text-warn bg-warn/10 border-warn/30" };
  return                   { label: "Low",      color: "text-safe-light bg-safe/10 border-safe/30" };
}

function DmcaModal({ violationId, onClose }: { violationId: string; onClose: () => void }) {
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(true);

  useState(() => {
    dmcaApi.generate(violationId)
      .then(setLetter)
      .catch(() => toast.error("Failed to generate DMCA letter"))
      .finally(() => setLoading(false));
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(letter);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass border border-blue-500/20 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-bold">DMCA Takedown Letter</h3>
          </div>
          <div className="flex items-center gap-2">
            {!loading && (
              <button onClick={copyToClipboard} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12 gap-3 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating with Gemini AI…
            </div>
          ) : (
            <pre className="text-slate-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">{letter}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

export function ViolationCard({ violation }: { violation: Violation }) {
  const qc = useQueryClient();
  const [showDmca, setShowDmca] = useState(false);
  const status = statusConfig[violation.status] ?? statusConfig.pending;
  const severity = severityFromScore(violation.similarity_score);
  const StatusIcon = status.icon;

  const handleStatusChange = async (newStatus: string) => {
    await toast.promise(
      violationsApi.updateStatus(violation.id, newStatus).then(() => {
        qc.invalidateQueries({ queryKey: ["violations"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
      }),
      { loading: "Updating…", success: `Marked as ${newStatus}`, error: "Update failed" }
    );
  };

  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded border", severity.color)}>
            {severity.label}
          </span>
          <span className={clsx("flex items-center gap-1", status.color)}>
            <StatusIcon className="w-3 h-3" />
            <span className="text-xs font-medium">{status.label}</span>
          </span>
          <span className="text-xs text-txt-muted font-mono">
            {(violation.similarity_score * 100).toFixed(1)}% match
          </span>
        </div>
        <a href={violation.source_url} target="_blank" rel="noopener noreferrer"
          className="text-txt-muted hover:text-brand shrink-0 transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {violation.asset_name && (
        <p className="text-sm font-semibold text-txt-primary truncate mb-1">{violation.asset_name}</p>
      )}
      <p className="text-xs text-txt-muted truncate font-mono mb-3">{violation.source_url}</p>

      <div className="flex items-center gap-4 pb-3 border-b border-line">
        <span className="text-xs text-txt-muted">
          <span className="text-txt-secondary">{violation.source_platform}</span>
        </span>
        <span className="text-xs text-txt-muted">
          {new Date(violation.detected_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>

      <div className="pt-3 space-y-2">
        {violation.status === "pending" && (
          <div className="flex gap-1.5">
            <button onClick={() => handleStatusChange("confirmed")}
              className="flex-1 py-1.5 text-xs font-medium rounded bg-danger/10 text-danger-light border border-danger/20 hover:bg-danger/15 transition-colors">
              Confirm
            </button>
            <button onClick={() => handleStatusChange("false_positive")}
              className="flex-1 py-1.5 text-xs font-medium rounded bg-ink-600 text-txt-secondary border border-line hover:text-txt-primary transition-colors">
              False Positive
            </button>
            <button onClick={() => handleStatusChange("resolved")}
              className="flex-1 py-1.5 text-xs font-medium rounded bg-safe/10 text-safe-light border border-safe/20 hover:bg-safe/15 transition-colors">
              Resolved
            </button>
          </div>
        )}
        <button onClick={() => setShowDmca(true)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded bg-ink-600 text-txt-secondary border border-line hover:text-brand hover:border-brand/30 transition-colors">
          <FileText className="w-3.5 h-3.5" />
          Generate DMCA Letter
        </button>
      </div>

      {showDmca && <DmcaModal violationId={violation.id} onClose={() => setShowDmca(false)} />}
    </div>
  );
}
