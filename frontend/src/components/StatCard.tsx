import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number | null;
  change?: number | null;
  changeSuffix?: string;
  icon: LucideIcon;
  subtext?: string;
  isPositiveGood?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeSuffix = '%',
  icon: Icon,
  subtext,
  isPositiveGood = true,
}) => {
  const isPositive = change !== undefined && change !== null && change > 0;
  const isNegative = change !== undefined && change !== null && change < 0;
  const isNeutral = change === undefined || change === null || change === 0;

  const getPillColor = () => {
    if (isNeutral) return 'bg-slate-800 text-slate-300 border-slate-700';
    if (isPositive) {
      return isPositiveGood
        ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
        : 'bg-red-950/40 text-red-400 border-red-500/30';
    }
    return isPositiveGood
      ? 'bg-red-950/40 text-red-400 border-red-500/30'
      : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30';
  };

  return (
    <div className="terminal-card p-5 hover:border-slate-700 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
          {title}
        </span>
        <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 text-terminal-accent">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold font-mono tracking-tight text-white">
          {value !== null && value !== undefined ? value : '—'}
        </div>

        {change !== undefined && change !== null && (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${getPillColor()}`}
          >
            {change > 0 ? '+' : ''}
            {change.toFixed(2)}
            {changeSuffix}
          </span>
        )}
      </div>

      {subtext && (
        <div className="mt-2 text-xs text-slate-400 font-mono truncate">
          {subtext}
        </div>
      )}
    </div>
  );
};
