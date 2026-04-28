"use client";

import { Violation } from "@/lib/types";
import {
  ExternalLink, CheckCircle, XCircle, AlertCircle, Clock,
  FileText, Copy, X, Loader2, Shield, MapPin, Calendar,
  Activity, AlertTriangle, ChevronRight, Zap
} from "lucide-react";
import { clsx } from "clsx";
import { violationsApi, dmcaApi } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import toast from "react-hot-toast";

// ── helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:        { label: "Pending Review", icon: Clock,        bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
  confirmed:      { label: "Confirmed",      icon: AlertCircle,  bg: "bg-red-50",    text: "text-red-600",    border: "border-red-200"   },
  resolved:       { label: "Resolved",       icon: CheckCircle,  bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200" },
  false_positive: { label: "False Positive", icon: XCircle,      bg: "bg-slate-50",  text: "text-slate-500",  border: "border-slate-200" },
};

function severity(score: number) {
  if (score >= 0.95) return { label: "Critical", dot: "bg-red-500",    badge: "bg-red-50 text-red-600 border-red-200",       bar: "bg-red-500"    };
  if (score >= 0.85) return { label: "High",     dot: "bg-orange-400", badge: "bg-orange-50 text-orange-600 border-orange-200", bar: "bg-orange-400" };
  if (score >= 0.70) return { label: "Medium",   dot: "bg-amber-400",  badge: "bg-amber-50 text-amber-600 border-amber-200",  bar: "bg-amber-400"  };
  return                    { label: "Low",      dot: "bg-green-500",  badge: "bg-green-50 text-green-600 border-green-200",   bar: "bg-green-500"  };
}

const PLATFORM_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  "YouTube":     { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-500"     },
  "Twitter/X":   { bg: "bg-slate-50",   text: "text-slate-700",   dot: "bg-slate-800"   },
  "Facebook":    { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-600"     },
  "TikTok":      { bg: "bg-pink-50",    text: "text-pink-700",    dot: "bg-pink-500"    },
  "Reddit":      { bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-500"  },
  "Twitch":      { bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-500"  },
  "Dailymotion": { bg: "bg-indigo-50",  text: "text-indigo-700",  dot: "bg-indigo-500"  },
  "Vimeo":       { bg: "bg-cyan-50",    text: "text-cyan-700",    dot: "bg-cyan-500"    },
};

function platformStyle(p: string) {
  return PLATFORM_STYLE[p] ?? { bg: "bg-slate-50", text: "text-slate-600", dot: "bg-slate-400" };
}

// ── DMCA modal ────────────────────────────────────────────────────────────────

function DmcaModal({ violationId, onClose }: { violationId: string; onClose: () => void }) {
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(true);

  useState(() => {
    dmcaApi.generate(violationId)
      .then(setLetter)
      .catch(() => toast.error("Failed to generate DMCA letter"))
      .finally(() => setLoading(false));
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white border border-line rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-line">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-brand" />
            <h3 className="text-txt-primary font-bold">DMCA Takedown Letter</h3>
          </div>
          <div className="flex items-center gap-2">
            {!loading && (
              <button
                onClick={() => { navigator.clipboard.writeText(letter); toast.success("Copied!"); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-brand text-white rounded-lg hover:bg-brand-dark transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> Copy
              </button>
            )}
            <button onClick={onClose} className="p-1.5 text-txt-muted hover:text-txt-primary rounded hover:bg-ink-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-txt-muted">
              <Loader2 className="w-6 h-6 animate-spin text-brand" />
              <p className="text-sm">Generating with Gemini AI…</p>
            </div>
          ) : (
            <pre className="text-txt-secondary text-sm whitespace-pre-wrap leading-relaxed font-mono">{letter}</pre>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Violation Detail Modal ────────────────────────────────────────────────────

export function ViolationModal({ violation, onClose }: { violation: Violation; onClose: () => void }) {
  const qc = useQueryClient();
  const [showDmca, setShowDmca] = useState(false);
  const sev = severity(violation.similarity_score);
  const st = STATUS_CONFIG[violation.status] ?? STATUS_CONFIG.pending;
  const ps = platformStyle(violation.source_platform);
  const pct = Math.round(violation.similarity_score * 100);

  const updateStatus = async (s: string) => {
    await toast.promise(
      violationsApi.updateStatus(violation.id, s).then(() => {
        qc.invalidateQueries({ queryKey: ["violations"] });
        qc.invalidateQueries({ queryKey: ["dashboard"] });
      }),
      { loading: "Updating…", success: `Marked as ${s}`, error: "Failed" }
    );
  };

  // Parse bullet points from AI analysis
  const analysisLines = (violation.ai_analysis ?? "No AI analysis available.")
    .split(/\.\s+/)
    .filter(Boolean)
    .map((s) => s.replace(/\.$/, "").trim());

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
        <div
          className="bg-white border border-line rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Header bar ── */}
          <div className={clsx("px-6 py-4 flex items-center justify-between rounded-t-2xl border-b border-line",
            sev.label === "Critical" ? "bg-red-50" :
            sev.label === "High"     ? "bg-orange-50" :
            sev.label === "Medium"   ? "bg-amber-50" : "bg-green-50"
          )}>
            <div className="flex items-center gap-3">
              <div className={clsx("w-2.5 h-2.5 rounded-full animate-pulse", sev.dot)} />
              <span className={clsx("text-xs font-bold px-2.5 py-1 rounded-full border", sev.badge)}>
                {sev.label} Severity
              </span>
              <span className={clsx("text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5",
                st.bg, st.text, st.border)}>
                <st.icon className="w-3 h-3" />
                {st.label}
              </span>
            </div>
            <button onClick={onClose} className="p-1.5 text-txt-muted hover:text-txt-primary rounded-lg hover:bg-white/80 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-5">

            {/* ── Asset + Match score ── */}
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <p className="text-xs font-semibold text-txt-muted uppercase tracking-widest mb-1">Protected Asset</p>
                <p className="text-lg font-bold text-txt-primary leading-snug">
                  {violation.asset_name ?? "Unknown Asset"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-txt-muted uppercase tracking-widest mb-1">Fingerprint Match</p>
                <p className={clsx("text-3xl font-black tabular-nums",
                  pct >= 95 ? "text-red-500" : pct >= 85 ? "text-orange-500" : pct >= 70 ? "text-amber-500" : "text-green-500"
                )}>
                  {pct}%
                </p>
              </div>
            </div>

            {/* ── Similarity bar ── */}
            <div>
              <div className="flex justify-between text-xs text-txt-muted mb-1.5">
                <span>Similarity score</span>
                <span className="font-semibold text-txt-secondary">{pct}% match across pHash · dHash · aHash</span>
              </div>
              <div className="w-full h-3 bg-ink-700 rounded-full overflow-hidden">
                <div
                  className={clsx("h-full rounded-full transition-all duration-700", sev.bar)}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-txt-muted mt-1">
                <span>0%</span><span>50%</span><span>100%</span>
              </div>
            </div>

            {/* ── Where found ── */}
            <div className="bg-ink-800 rounded-xl p-4 space-y-3">
              <p className="text-xs font-bold text-txt-primary uppercase tracking-widest flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand" /> Where It Was Found
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-txt-muted mb-1">Platform</p>
                  <span className={clsx("inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border",
                    ps.bg, ps.text, "border-transparent")}>
                    <span className={clsx("w-2 h-2 rounded-full", ps.dot)} />
                    {violation.source_platform}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-txt-muted mb-1">Detected On</p>
                  <p className="text-xs font-semibold text-txt-primary flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-txt-muted" />
                    {new Date(violation.detected_at).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs text-txt-muted mb-1">Infringing URL</p>
                <a
                  href={violation.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-brand hover:text-brand-dark font-mono break-all group"
                >
                  <span className="truncate">{violation.source_url}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                </a>
              </div>
            </div>

            {/* ── AI Analysis ── */}
            <div className="border border-blue-100 bg-blue-50 rounded-xl p-4">
              <p className="text-xs font-bold text-brand uppercase tracking-widest flex items-center gap-1.5 mb-3">
                <Zap className="w-3.5 h-3.5" /> Gemini AI Analysis
              </p>
              <div className="space-y-2">
                {analysisLines.map((line, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-brand mt-0.5 shrink-0" />
                    <p className="text-xs text-slate-700 leading-relaxed">{line}.</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── What this means ── */}
            <div className="border border-line rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-txt-primary uppercase tracking-widest flex items-center gap-1.5 mb-2">
                <Shield className="w-3.5 h-3.5 text-brand" /> What This Means
              </p>
              {pct >= 95 && (
                <p className="text-xs text-red-600 leading-relaxed">
                  <strong>Near-exact copy detected.</strong> This is almost certainly the original content reposted without authorization. Immediate takedown action is strongly recommended.
                </p>
              )}
              {pct >= 85 && pct < 95 && (
                <p className="text-xs text-orange-700 leading-relaxed">
                  <strong>High-confidence match.</strong> The content has likely been re-encoded, cropped, or slightly modified but originates from your protected asset. Takedown notice is recommended.
                </p>
              )}
              {pct >= 70 && pct < 85 && (
                <p className="text-xs text-amber-700 leading-relaxed">
                  <strong>Moderate match detected.</strong> Content shares significant visual similarity. Review manually before issuing a takedown — may be derivative content.
                </p>
              )}
              {pct < 70 && (
                <p className="text-xs text-green-700 leading-relaxed">
                  <strong>Low similarity.</strong> Likely coincidental similarity or a different asset. Consider marking as false positive after review.
                </p>
              )}
            </div>

            {/* ── Actions ── */}
            <div className="space-y-2 pt-1">
              {violation.status === "pending" && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateStatus("confirmed")}
                    className="py-2.5 text-sm font-semibold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <AlertCircle className="w-4 h-4" /> Confirm Violation
                  </button>
                  <button
                    onClick={() => updateStatus("resolved")}
                    className="py-2.5 text-sm font-semibold rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark Resolved
                  </button>
                </div>
              )}
              {violation.status === "confirmed" && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateStatus("resolved")}
                    className="py-2.5 text-sm font-semibold rounded-xl bg-green-500 text-white hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle className="w-4 h-4" /> Mark Resolved
                  </button>
                  <button
                    onClick={() => updateStatus("false_positive")}
                    className="py-2.5 text-sm font-semibold rounded-xl bg-ink-700 text-txt-secondary border border-line hover:text-txt-primary transition-colors flex items-center justify-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> False Positive
                  </button>
                </div>
              )}
              <button
                onClick={() => setShowDmca(true)}
                className="w-full py-2.5 text-sm font-semibold rounded-xl border border-brand text-brand hover:bg-brand hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" /> Generate DMCA Takedown Letter
              </button>
            </div>
          </div>
        </div>
      </div>

      {showDmca && <DmcaModal violationId={violation.id} onClose={() => setShowDmca(false)} />}
    </>
  );
}

// ── Violation Card (summary) ──────────────────────────────────────────────────

export function ViolationCard({ violation }: { violation: Violation }) {
  const [open, setOpen] = useState(false);
  const sev = severity(violation.similarity_score);
  const st = STATUS_CONFIG[violation.status] ?? STATUS_CONFIG.pending;
  const ps = platformStyle(violation.source_platform);
  const pct = Math.round(violation.similarity_score * 100);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="card card-hover p-4 text-left w-full group transition-all"
      >
        {/* Top row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={clsx("flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full border", sev.badge)}>
              <span className={clsx("w-1.5 h-1.5 rounded-full", sev.dot)} />
              {sev.label}
            </span>
            <span className={clsx("flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border",
              st.bg, st.text, st.border)}>
              <st.icon className="w-3 h-3" />
              {st.label}
            </span>
          </div>
          <span className={clsx("text-xs font-black tabular-nums",
            pct >= 95 ? "text-red-500" : pct >= 85 ? "text-orange-500" : pct >= 70 ? "text-amber-500" : "text-green-500"
          )}>
            {pct}%
          </span>
        </div>

        {/* Asset name */}
        {violation.asset_name && (
          <p className="text-sm font-semibold text-txt-primary truncate mb-1">{violation.asset_name}</p>
        )}

        {/* Platform + URL */}
        <div className="flex items-center gap-2 mb-3">
          <span className={clsx("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded", ps.bg, ps.text)}>
            <span className={clsx("w-1.5 h-1.5 rounded-full", ps.dot)} />
            {violation.source_platform}
          </span>
          <span className="text-xs text-txt-muted truncate font-mono flex-1">{violation.source_url}</span>
        </div>

        {/* Similarity bar */}
        <div className="w-full h-1.5 bg-ink-700 rounded-full overflow-hidden mb-3">
          <div className={clsx("h-full rounded-full", sev.bar)} style={{ width: `${pct}%` }} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-txt-muted">
            {new Date(violation.detected_at).toLocaleDateString("en", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <span className="text-xs text-brand font-medium flex items-center gap-1 group-hover:gap-1.5 transition-all">
            View details <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </button>

      {open && <ViolationModal violation={violation} onClose={() => setOpen(false)} />}
    </>
  );
}
