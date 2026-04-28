"use client";

import { useState } from "react";
import { Settings, Lock, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/lib/api";
import { auth } from "@/lib/auth";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { toast.error("New passwords do not match"); return; }
    if (next.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      await authApi.changePassword(current, next);
      toast.success("Password changed — please log in again");
      auth.clear();
      setTimeout(() => (window.location.href = "/login"), 1500);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="pb-6 border-b border-line">
        <h1 className="text-xl font-bold text-txt-primary">Settings</h1>
        <p className="text-sm text-txt-muted mt-0.5">Manage your account configuration</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="w-4 h-4 text-txt-muted" />
          <h2 className="text-sm font-semibold text-txt-primary">Change Password</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Current Password", value: current, onChange: setCurrent, show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
            { label: "New Password", value: next, onChange: setNext, show: showNext, toggle: () => setShowNext(!showNext) },
            { label: "Confirm New Password", value: confirm, onChange: setConfirm, show: showNext, toggle: () => setShowNext(!showNext) },
          ].map(({ label, value, onChange, show, toggle }) => (
            <div key={label}>
              <label className="text-xs text-txt-muted mb-1.5 block">{label}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-txt-muted" />
                <input
                  type={show ? "text" : "password"}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  required
                  className="w-full bg-ink-700 border border-line rounded pl-9 pr-9 py-2.5 text-sm text-txt-primary placeholder-txt-muted focus:outline-none focus:border-brand transition-colors"
                  placeholder="••••••••"
                />
                <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-muted hover:text-txt-secondary">
                  {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary text-sm py-2.5 disabled:opacity-50 mt-1"
          >
            {loading ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="text-sm font-semibold text-txt-primary mb-3">Account Info</h2>
        <p className="text-txt-secondary text-sm">Logged in as <span className="text-txt-primary font-medium">{auth.getUser()}</span></p>
        <p className="text-txt-muted text-xs mt-1">To change username, update ADMIN_USERNAME in backend/.env and restart the server.</p>
      </div>
    </div>
  );
}
