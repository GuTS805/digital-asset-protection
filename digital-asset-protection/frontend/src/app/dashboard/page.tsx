"use client";

import { useQuery } from "@tanstack/react-query";
import { monitoringApi } from "@/lib/api";
import { StatsCard } from "@/components/StatsCard";
import { ViolationCard } from "@/components/ViolationCard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from "recharts";
import { FolderLock, AlertTriangle, ScanLine, HardDrive, Loader2, RefreshCw } from "lucide-react";

const PLATFORM_COLORS = ["#3b82f6", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981"];
const SEVERITY_COLORS = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#10b981" };

export default function DashboardPage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: monitoringApi.dashboard,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 text-brand animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <p className="text-txt-secondary text-sm mb-4">
          Failed to connect to backend at{" "}
          <code className="text-brand text-xs font-mono">{process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}</code>
        </p>
        <button onClick={() => refetch()} className="btn-primary text-sm">Retry</button>
      </div>
    );
  }

  const severityData = [
    { name: "Critical", value: data.severity_breakdown.critical, color: SEVERITY_COLORS.critical },
    { name: "High", value: data.severity_breakdown.high, color: SEVERITY_COLORS.high },
    { name: "Medium", value: data.severity_breakdown.medium, color: SEVERITY_COLORS.medium },
    { name: "Low", value: data.severity_breakdown.low, color: SEVERITY_COLORS.low },
  ].filter((d) => d.value > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-line">
        <div>
          <h1 className="text-xl font-bold text-txt-primary">Dashboard</h1>
          <p className="text-sm text-txt-muted mt-0.5">Protected media portfolio overview</p>
        </div>
        <button onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-1.5 btn-ghost text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard label="Protected Assets" value={data.total_assets} icon={FolderLock} color="blue" description="registered & monitored" />
        <StatsCard label="Active Violations" value={data.active_violations} icon={AlertTriangle} color="red" description="pending review" />
        <StatsCard label="Scans Today" value={data.scans_today} icon={ScanLine} color="cyan" description="automated checks" />
        <StatsCard label="Content Volume" value={`${data.protected_content_gb} GB`} icon={HardDrive} color="green" description="total asset volume" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <p className="text-sm font-semibold text-txt-primary mb-4">Violations — Last 7 Days</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.violation_trend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d45" />
              <XAxis dataKey="date" tick={{ fill: "#475569", fontSize: 10 }}
                tickFormatter={(v) => new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })} />
              <YAxis tick={{ fill: "#475569", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#0d1421", border: "1px solid #1e2d45", borderRadius: 6, fontSize: 12 }}
                labelStyle={{ color: "#94a3b8" }} itemStyle={{ color: "#3b82f6" }} />
              <Line type="monotone" dataKey="violations" stroke="#2563eb" strokeWidth={2}
                dot={{ fill: "#2563eb", r: 3 }} activeDot={{ r: 5, fill: "#3b82f6" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <p className="text-sm font-semibold text-txt-primary mb-4">Severity Breakdown</p>
          {severityData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={severityData} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                  {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0d1421", border: "1px solid #1e2d45", borderRadius: 6, fontSize: 12 }} />
                <Legend formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-txt-muted text-sm">No violations yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Platform breakdown */}
      {data.platform_breakdown.length > 0 && (
        <div className="card p-5">
          <p className="text-sm font-semibold text-txt-primary mb-4">Violations by Platform</p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.platform_breakdown} layout="vertical">
              <XAxis type="number" tick={{ fill: "#475569", fontSize: 10 }} />
              <YAxis dataKey="platform" type="category" tick={{ fill: "#94a3b8", fontSize: 11 }} width={90} />
              <Tooltip contentStyle={{ background: "#0d1421", border: "1px solid #1e2d45", borderRadius: 6, fontSize: 12 }}
                itemStyle={{ color: "#3b82f6" }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.platform_breakdown.map((_, i) => <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent violations */}
      {data.recent_violations.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-txt-primary mb-3">Recent Violations</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.recent_violations.map((v: any) => <ViolationCard key={v.id} violation={v} />)}
          </div>
        </div>
      )}

      {data.total_assets === 0 && (
        <div className="card p-16 text-center">
          <FolderLock className="w-10 h-10 text-ink-500 mx-auto mb-4" />
          <h3 className="text-txt-primary font-semibold mb-1">No assets registered</h3>
          <p className="text-txt-muted text-sm mb-5">Upload your first asset to begin monitoring.</p>
          <a href="/assets" className="inline-flex items-center gap-2 btn-primary text-sm">
            Register an asset
          </a>
        </div>
      )}
    </div>
  );
}
