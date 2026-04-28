"use client";

import { useQuery } from "@tanstack/react-query";
import { monitoringApi, assetsApi } from "@/lib/api";
import { Loader2, Radio, Activity, Clock, Globe, Eye } from "lucide-react";

function ActivityItem({ item }: { item: any }) {
  const score = item.similarity_score ?? 0;
  const color =
    score > 0.95 ? "border-red-500/40 bg-red-500/5" :
    score > 0.85 ? "border-orange-500/40 bg-orange-500/5" :
    score > 0.70 ? "border-amber-500/40 bg-amber-500/5" :
    "border-green-500/40 bg-green-500/5";

  const dot =
    score > 0.95 ? "bg-red-400" :
    score > 0.85 ? "bg-orange-400" :
    score > 0.70 ? "bg-amber-400" :
    "bg-green-400";

  return (
    <div className={`flex items-start gap-4 p-4 rounded-xl border ${color} transition-all`}>
      <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-white font-medium text-sm truncate">
            {item.assets?.name ?? "Unknown Asset"}
          </p>
          <span className="text-slate-400 text-xs shrink-0">
            {(score * 100).toFixed(1)}% match
          </span>
        </div>
        <p className="text-slate-400 text-xs mt-0.5 truncate">{item.source_url}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-slate-500 text-xs">
            <Globe className="w-3 h-3" />
            {item.source_platform}
          </span>
          <span className="flex items-center gap-1 text-slate-500 text-xs">
            <Clock className="w-3 h-3" />
            {new Date(item.detected_at).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function MonitoringPage() {
  const { data: activity, isLoading: actLoading, refetch: refetchActivity } = useQuery({
    queryKey: ["activity"],
    queryFn: monitoringApi.activity,
    refetchInterval: 30_000,
  });

  const { data: assets } = useQuery({
    queryKey: ["assets"],
    queryFn: assetsApi.list,
  });

  const total = activity?.length ?? 0;
  const pending = activity?.filter((v: any) => v.status === "pending").length ?? 0;
  const criticalCount = activity?.filter((v: any) => v.similarity_score > 0.95).length ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-8 h-8 text-cyan-400" />
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Live Monitor</h1>
            <p className="text-slate-400 text-sm">
              Scanning {assets?.length ?? 0} assets — auto-refreshes every 30 seconds
            </p>
          </div>
        </div>
        <button
          onClick={() => refetchActivity()}
          className="px-4 py-2 text-sm bg-surface-700 border border-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          Refresh Now
        </button>
      </div>

      {/* Stat pills */}
      <div className="flex flex-wrap gap-4">
        <div className="glass border border-cyan-500/20 rounded-xl px-5 py-4 flex items-center gap-3">
          <Activity className="w-5 h-5 text-cyan-400" />
          <div>
            <p className="text-2xl font-bold text-white">{total}</p>
            <p className="text-slate-400 text-xs">Total detections</p>
          </div>
        </div>
        <div className="glass border border-amber-500/20 rounded-xl px-5 py-4 flex items-center gap-3">
          <Eye className="w-5 h-5 text-amber-400" />
          <div>
            <p className="text-2xl font-bold text-white">{pending}</p>
            <p className="text-slate-400 text-xs">Awaiting review</p>
          </div>
        </div>
        <div className="glass border border-red-500/20 rounded-xl px-5 py-4 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-pulse" />
          <div>
            <p className="text-2xl font-bold text-white">{criticalCount}</p>
            <p className="text-slate-400 text-xs">Critical (95%+ match)</p>
          </div>
        </div>
      </div>

      {/* Asset monitoring status */}
      {assets && assets.length > 0 && (
        <div className="glass border border-slate-700/50 rounded-2xl p-6">
          <h2 className="text-white font-bold mb-4">Asset Monitoring Status</h2>
          <div className="space-y-3">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between bg-surface-800 rounded-xl px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" />
                  <span className="text-white text-sm font-medium">{asset.name}</span>
                  <span className="text-slate-500 text-xs">{asset.organization}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-500">{asset.scan_count} scans</span>
                  <span className={asset.violation_count > 0 ? "text-red-400" : "text-green-400"}>
                    {asset.violation_count} violation{asset.violation_count !== 1 ? "s" : ""}
                  </span>
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full capitalize">
                    {asset.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity feed */}
      <div className="glass border border-slate-700/50 rounded-2xl p-6">
        <h2 className="text-white font-bold mb-5">Detection Activity Feed</h2>
        {actLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        ) : activity && activity.length > 0 ? (
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
            {activity.map((item: any) => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Radio className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">No detections yet</p>
            <p className="text-slate-600 text-sm mt-1">
              Monitoring starts automatically. Trigger a manual scan from the Assets page.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
