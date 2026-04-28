import Link from "next/link";
import { Shield, Fingerprint, Globe, Zap, AlertTriangle, BarChart2, ArrowRight, CheckCircle } from "lucide-react";

const FEATURES = [
  { icon: Fingerprint, title: "Perceptual Fingerprinting", desc: "Multi-algorithm hashing (pHash, dHash, aHash) identifies copies even after cropping, compression, or color shifts." },
  { icon: Shield, title: "LSB Watermarking", desc: "Invisible steganographic watermark embedded at upload — readable by the system even after screenshots or re-encoding." },
  { icon: Globe, title: "Web-Scale Crawling", desc: "Google Custom Search scans social platforms and the open web every 6 hours for unauthorized copies of your assets." },
  { icon: Zap, title: "Gemini AI Analysis", desc: "Each match is assessed by Gemini 1.5 Flash — severity rating, usage type, and one-click DMCA letter generation." },
  { icon: AlertTriangle, title: "Violation Workflow", desc: "Triage flagged content as Confirmed, Resolved, or False Positive. Full audit trail on every asset." },
  { icon: BarChart2, title: "Analytics Dashboard", desc: "Trend charts, platform breakdown, and portfolio health in one command center. Export violations as CSV." },
];

const STATS = [
  { value: "4", label: "Hash algorithms" },
  { value: "6 hr", label: "Scan interval" },
  { value: "94%+", label: "Detection accuracy" },
  { value: "Free", label: "To deploy" },
];

const HOW = [
  { n: "01", title: "Register", desc: "Upload your image. ShieldSync fingerprints it and embeds an invisible watermark in under 2 seconds." },
  { n: "02", title: "Monitor", desc: "Automated crawlers check Google Images and social platforms every 6 hours using your asset's fingerprint." },
  { n: "03", title: "Detect", desc: "Perceptual hash comparison with Hamming distance ≤ 12 bits flags unauthorized copies for review." },
  { n: "04", title: "Act", desc: "Gemini AI assesses severity and generates a ready-to-send DMCA takedown letter in one click." },
];

export default function HomePage() {
  return (
    <div className="text-txt-primary">

      {/* ── Hero ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line text-xs text-txt-secondary mb-8 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse-slow" />
            Google Solution Challenge 2026 — Digital Asset Protection
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
            Stop sports media theft<br />
            <span className="gradient-text">before it spreads.</span>
          </h1>

          <p className="text-lg text-txt-secondary leading-relaxed mb-10 max-w-xl">
            ShieldSync fingerprints your official content, embeds invisible watermarks, and continuously hunts the web for unauthorized copies — automated, 24/7.
          </p>

          <div className="flex flex-wrap gap-3">
            <Link href="/assets" className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand hover:bg-brand-light text-white text-sm font-semibold rounded-lg transition-colors">
              Start protecting <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 btn-ghost text-sm">
              View dashboard
            </Link>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-8 mt-16 pt-8 border-t border-line">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-2xl font-bold text-txt-primary tabular-nums">{value}</p>
                <p className="text-xs text-txt-muted mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────── */}
      <section className="border-t border-line bg-ink-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">Process</p>
          <h2 className="text-2xl font-bold mb-12">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line">
            {HOW.map(({ n, title, desc }) => (
              <div key={n} className="bg-ink-800 p-8">
                <p className="text-3xl font-black text-ink-600 mb-4">{n}</p>
                <h3 className="text-sm font-semibold text-txt-primary mb-2">{title}</h3>
                <p className="text-sm text-txt-secondary leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-3">Capabilities</p>
        <h2 className="text-2xl font-bold mb-12">Built on real technology</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card card-hover p-6">
              <Icon className="w-5 h-5 text-brand mb-4" />
              <h3 className="text-sm font-semibold text-txt-primary mb-2">{title}</h3>
              <p className="text-sm text-txt-secondary leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────── */}
      <section className="border-t border-line bg-ink-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-2">Ready to protect your content?</h2>
            <p className="text-txt-secondary text-sm">Upload your first asset — fingerprinting and monitoring start immediately.</p>
            <ul className="mt-4 space-y-1.5">
              {["Free-tier APIs — no premium required", "Persistent storage — data survives restarts", "DMCA letters generated by Gemini AI"].map(t => (
                <li key={t} className="flex items-center gap-2 text-xs text-txt-secondary">
                  <CheckCircle className="w-3.5 h-3.5 text-safe shrink-0" />{t}
                </li>
              ))}
            </ul>
          </div>
          <Link href="/assets" className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-brand hover:bg-brand-light text-white font-semibold rounded-lg transition-colors text-sm whitespace-nowrap">
            Get started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

    </div>
  );
}
