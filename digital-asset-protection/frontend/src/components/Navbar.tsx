"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Shield, LayoutDashboard, FolderLock, Radio, AlertTriangle, Menu, X, LogOut, User, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { auth } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: FolderLock },
  { href: "/monitoring", label: "Monitor", icon: Radio },
  { href: "/violations", label: "Violations", icon: AlertTriangle },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    setUsername(auth.getUser());
  }, [pathname]);

  const handleLogout = () => {
    auth.clear();
    router.push("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-ink-900 border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Shield className="w-5 h-5 text-brand" />
            <span className="text-sm font-bold text-txt-primary tracking-tight">ShieldSync</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5 mx-6">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors",
                  pathname.startsWith(href)
                    ? "text-txt-primary bg-ink-700"
                    : "text-txt-secondary hover:text-txt-primary hover:bg-ink-700"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-2">
            {username && (
              <span className="text-xs text-txt-muted font-medium border border-line rounded px-2 py-1">
                {username}
              </span>
            )}
            <Link href="/assets" className="btn-primary text-xs py-1.5">
              + Protect Asset
            </Link>
            {username && (
              <Link href="/settings" className="p-1.5 text-txt-muted hover:text-txt-secondary rounded hover:bg-ink-700 transition-colors">
                <Settings className="w-4 h-4" />
              </Link>
            )}
            {username && (
              <button onClick={handleLogout} className="p-1.5 text-txt-muted hover:text-danger-light rounded hover:bg-ink-700 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-txt-secondary" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-ink-800 border-t border-line px-4 py-2 space-y-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}
              className={clsx("flex items-center gap-2.5 px-3 py-2.5 rounded text-sm font-medium",
                pathname.startsWith(href) ? "text-txt-primary bg-ink-700" : "text-txt-secondary hover:text-txt-primary"
              )}
            >
              <Icon className="w-4 h-4" />{label}
            </Link>
          ))}
          {username && (
            <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-3 py-2.5 text-danger-light text-sm font-medium">
              <LogOut className="w-4 h-4" />Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
