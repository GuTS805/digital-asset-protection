import { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "blue" | "cyan" | "red" | "green" | "amber";
  description?: string;
}

const barMap: Record<string, string> = {
  blue: "stat-bar-blue", cyan: "stat-bar-sky",
  red: "stat-bar-red", green: "stat-bar-green", amber: "stat-bar-red",
};
const iconMap: Record<string, string> = {
  blue: "text-brand", cyan: "text-sky", red: "text-danger-light",
  green: "text-safe-light", amber: "text-warn-light",
};

export function StatsCard({ label, value, icon: Icon, trend, color = "blue", description }: StatsCardProps) {
  return (
    <div className={clsx("card pl-5 pr-6 py-5 card-hover", barMap[color])}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-txt-muted uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-txt-primary mt-1 tabular-nums">{value}</p>
          {description && <p className="text-xs text-txt-muted mt-0.5">{description}</p>}
          {trend && (
            <p className={clsx("text-xs mt-1.5 font-medium", iconMap[color])}>
              {trend.value > 0 ? "↑" : "↓"} {Math.abs(trend.value)} {trend.label}
            </p>
          )}
        </div>
        <Icon className={clsx("w-5 h-5 shrink-0 mt-0.5", iconMap[color])} />
      </div>
    </div>
  );
}
