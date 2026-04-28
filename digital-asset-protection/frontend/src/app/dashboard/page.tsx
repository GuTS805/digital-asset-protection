"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { monitoringApi, demoApi } from "@/lib/api";
import { useState } from "react";
import toast from "react-hot-toast";
import { ViolationCard } from "@/components/ViolationCard";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from "recharts";
import { FolderLock, AlertTriangle, ScanLine, HardDrive, Loader2, RefreshCw, TrendingUp, TrendingDown, Sparkles } from "lucide-react";

const PLATFORM_COLORS = ["#2563eb", "#0ea5e9", "#8b5cf6", "#f59e0b", "#ef4444", "#10b981"];
const SEVERITY_COLORS = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#10b981" };

function StatCard({ label, value, icon: Icon, color, trend, desc }: {
  label: string; value: string | number; icon: any; color: string; trend?: number; desc?: string;
}) {
  const colors: Record<string, { bg: string; icon: string; border: string }> = {
    blue:  { bg: "bg-blue-50",   icon: "text-blue-600",   border: "border-blue-100" },
    red:   { bg: "bg-red-50",    icon: "text-red-500",    border: "border-red-100" },
    cyan:  { bg: "bg-cyan-50",   icon: "text-cyan-600",   border: "border-cyan-100" },
    green: { bg: "bg-green-50",  icon: "text-green-600",  border: "border-green-100" },
  };
  const c = colors[color] ?? colors.blue;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${c.bg} ${c.border} border flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.icon}`} />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-medium ${trend >= 0 ? "text-green-600" : "text-red-500"}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-txt-primary tabular-nums">{value}</p>
      <p className="text-xs text-txt-muted mt-1">{label}</p>
      {desc && <p className="text-xs text-txt-secondary mt-0.5">{desc}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const qc = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: monitoringApi.dashboard,
    refetchInterval: 60_000,
  });

  const handleLoadDemo = async () => {
    setSeeding(true);
    try {
      const result = await demoApi.seed();
      toast.success(`Demo loaded: ${result.assets_created} assets, ${result.violations_created} violations`);
      qc.invalidateQueries();
    } catch {
      toast.error("Failed to load demo data");
    } finally {
      setSeeding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ink-900">
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
    { name: "High",     value: data.severity_breakdown.high,     color: SEVERITY_COLORS.high },
    { name: "Medium",   value: data.severity_breakdown.medium,   color: SEVERITY_COLORS.medium },
    { name: "Low",      value: data.severity_breakdown.low,      color: SEVERITY_COLORS.low },
  ].filter((d) => d.value > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-txt-muted font-medium uppercase tracking-widest mb-1">Overview</p>
          <h1 className="text-2xl font-bold text-txt-primary">Protection Dashboard</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleLoadDemo}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1.5 btn-ghost text-xs"
          >
            {seeding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Demo
          </button>
          <button onClick={() => refetch()} className="flex items-center gap-1.5 px-3 py-1.5 btn-ghost text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Protected Assets"  value={data.total_assets}           icon={FolderLock}     color="blue"  desc="registered & monitored" />
        <StatCard label="Active Violations" value={data.active_violations}       icon={AlertTriangle}  color="red"   desc="pending review" />
        <StatCard label="Scans Today"       value={data.scans_today}             icon={ScanLine}       color="cyan"  desc="automated checks" />
        <StatCard label="Content Volume"    value={`${data.protected_content_gb} GB`} icon={HardDrive} color="green" desc="total asset volume" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Line chart */}
        <div className="lg:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm font-semibold text-txt-primary">Violation Trend</p>
              <p className="text-xs text-txt-muted mt-0.5">Last 7 days</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.violation_trend}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }}
                tickFormatter={(v) => new Date(v).toLocaleDateString("en", { month: "short", day: "numeric" })} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "#475569" }} itemStyle={{ color: "#2563eb" }} />
              <Line type="monotone" dataKey="violations" stroke="#2563eb" strokeWidth={2.5}
                dot={{ fill: "#2563eb", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: "#2563eb" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donut chart */}
        <div className="card p-6">
          <div className="mb-4">
            <p className="text-sm font-semibold text-txt-primary">Severity Breakdown</p>
            <p className="text-xs text-txt-muted mt-0.5">By risk level</p>
          </div>
          {severityData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={severityData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {severityData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {severityData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-xs text-txt-secondary">{d.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-txt-primary">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex flex-col items-center justify-center gap-2">
              <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
                <FolderLock className="w-7 h-7 text-green-500" />
              </div>
              <p className="text-sm font-medium text-txt-primary">All clean</p>
              <p className="text-xs text-txt-muted">No violations detected</p>
            </div>
          )}
        </div>
      </div>

      {/* Platform breakdown */}
      {data.platform_breakdown.length > 0 && (
        <div className="card p-6">
          <div className="mb-5">
            <p className="text-sm font-semibold text-txt-primary">Violations by Platform</p>
            <p className="text-xs text-txt-muted mt-0.5">Distribution across sources</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.platform_breakdown} layout="vertical">
              <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis dataKey="platform" type="category" tick={{ fill: "#475569", fontSize: 11 }} width={90} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
                itemStyle={{ color: "#2563eb" }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={20}>
                {data.platform_breakdown.map((_, i) => <Cell key={i} fill={PLATFORM_COLORS[i % PLATFORM_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent violations */}
      {data.recent_violations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-txt-primary">Recent Violations</p>
              <p className="text-xs text-txt-muted mt-0.5">Latest detected infringements</p>
            </div>
            <a href="/violations" className="text-xs text-brand font-medium hover:text-brand-dark transition-colors">
              View all →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.recent_violations.map((v: any) => <ViolationCard key={v.id} violation={v} />)}
          </div>
        </div>
      )}

      {data.total_assets === 0 && (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto mb-4">
            <FolderLock className="w-8 h-8 text-brand" />
          </div>
          <h3 className="text-txt-primary font-semibold mb-1">No assets registered yet</h3>
          <p className="text-txt-muted text-sm mb-6">Upload your first asset — or load demo data to explore the full product.</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <a href="/assets" className="inline-flex items-center gap-2 btn-primary text-sm">
              <FolderLock className="w-4 h-4" /> Register an asset
            </a>
            <button
              onClick={handleLoadDemo}
              disabled={seeding}
              className="inline-flex items-center gap-2 btn-ghost text-sm"
            >
              {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {seeding ? "Loading…" : "Load demo data"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
