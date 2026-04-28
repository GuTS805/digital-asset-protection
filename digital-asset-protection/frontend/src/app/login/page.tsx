"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Fingerprint, ScanLine, AlertTriangle } from "lucide-react";
import { authApi } from "@/lib/api";
import { auth } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authApi.login(username, password);
      auth.setSession(data.access_token, data.username);
      router.push("/dashboard");
    } catch {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left: Form ───────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 bg-ink-950">
        <div className="w-full max-w-sm">
          {/* Logo */}
          <div className="flex items-center gap-2.5 mb-10">
            <Shield className="w-7 h-7 text-brand" />
            <span className="text-base font-bold text-txt-primary tracking-tight">ShieldSync</span>
          </div>

          <h1 className="text-2xl font-bold text-txt-primary mb-1">Welcome back!</h1>
          <p className="text-sm text-txt-muted mb-8">
            Sign in to your protection dashboard.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
                className="w-full bg-transparent border border-line rounded-full px-5 py-3 text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-brand transition-colors"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                className="w-full bg-transparent border border-line rounded-full px-5 py-3 pr-12 text-sm text-txt-primary placeholder:text-txt-muted focus:outline-none focus:border-brand transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-secondary transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-danger-light text-xs px-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-txt-primary text-ink-950 text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Signing in…" : "Login"}
            </button>
          </form>

          <p className="text-xs text-txt-muted text-center mt-8">
            Default credentials: <span className="text-txt-secondary font-mono">admin / shieldsync123</span>
          </p>
        </div>
      </div>

      {/* ── Right: Decorative panel ───────────────── */}
      <div className="hidden lg:flex flex-1 bg-ink-800 border-l border-line items-center justify-center p-12 relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative z-10 w-full max-w-sm space-y-6">
          {/* Headline */}
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-2">Digital Asset Protection</p>
            <h2 className="text-2xl font-bold text-txt-primary leading-snug">
              Protect your content<br />before it spreads.
            </h2>
          </div>

          {/* Stat cards */}
          <div className="bg-ink-700 border border-line rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand/10 flex items-center justify-center">
                  <Fingerprint className="w-4 h-4 text-brand" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-txt-primary">Fingerprint Match</p>
                  <p className="text-xs text-txt-muted">Champions League Final</p>
                </div>
              </div>
              <span className="text-xs font-bold text-safe-light bg-safe/10 border border-safe/20 px-2 py-0.5 rounded-full">97.4%</span>
            </div>

            <div className="w-full bg-ink-600 rounded-full h-1.5">
              <div className="bg-brand h-1.5 rounded-full" style={{ width: "74%" }} />
            </div>
            <p className="text-xs text-txt-muted">3 of 4 hash algorithms matched</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-ink-700 border border-line rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ScanLine className="w-3.5 h-3.5 text-brand" />
                <span className="text-xs text-txt-muted">Scans Today</span>
              </div>
              <p className="text-xl font-bold text-txt-primary tabular-nums">142</p>
              <p className="text-xs text-safe-light mt-0.5">+12% vs yesterday</p>
            </div>

            <div className="bg-ink-700 border border-line rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-3.5 h-3.5 text-danger-light" />
                <span className="text-xs text-txt-muted">Violations</span>
              </div>
              <p className="text-xl font-bold text-txt-primary tabular-nums">7</p>
              <p className="text-xs text-danger-light mt-0.5">3 critical</p>
            </div>
          </div>

          <div className="bg-ink-700 border border-line rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-safe animate-pulse shrink-0" />
            <p className="text-xs text-txt-secondary">Monitoring active — next scan in <span className="text-txt-primary font-medium">4h 32m</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
