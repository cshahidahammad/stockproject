import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  Activity,
  Calendar,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useDataset } from '../context/DatasetContext';
import { StatCard } from '../components/StatCard';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';
import { api } from '../services/api';
import { ChartDataPoint } from '../types';

export const DashboardPage: React.FC<{ onNavigateToCharts: () => void; onNavigateToPredict: () => void }> = ({
  onNavigateToCharts,
  onNavigateToPredict,
}) => {
  const { currentDatasetId, activeFilename, isDefault, summary, isLoadingSummary, summaryError, refreshSummary } =
    useDataset();

  const [recentChartData, setRecentChartData] = useState<ChartDataPoint[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchRecentChart = async () => {
      setIsLoadingChart(true);
      try {
        const res = await api.getDatasetCharts(currentDatasetId);
        if (isMounted) {
          // Take the last 60 observations for the dashboard preview
          const last60 = res.data.slice(-60);
          setRecentChartData(last60);
        }
      } catch (e) {
        console.error('Failed to fetch dashboard chart data', e);
      } finally {
        if (isMounted) setIsLoadingChart(false);
      }
    };

    fetchRecentChart();
    return () => {
      isMounted = false;
    };
  }, [currentDatasetId]);

  if (isLoadingSummary) {
    return <LoadingSpinner message="Calculating dataset financial metrics..." />;
  }

  if (summaryError) {
    return (
      <ErrorAlert
        title="Failed to Load Dashboard Metrics"
        message={summaryError}
        onRetry={refreshSummary}
      />
    );
  }

  const latestClose = summary?.latest_close;
  const previousClose = summary?.previous_close;
  const priceChange = summary?.price_change;
  const priceChangePct = summary?.price_change_pct;
  const dailyReturn = summary?.latest_daily_return !== null && summary?.latest_daily_return !== undefined
    ? summary.latest_daily_return * 100
    : null;
  const ma10 = summary?.latest_ma10;
  const ma20 = summary?.latest_ma20;
  const validObservations = summary?.total_valid_observations ?? 0;
  const mostRecentDate = summary?.most_recent_date ?? '—';
  const earliestDate = summary?.earliest_date ?? '—';

  return (
    <div className="space-y-6">
      {/* Active dataset banner */}
      <div className="terminal-card p-5 border-l-4 border-l-terminal-accent flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div className="p-2.5 rounded-lg bg-terminal-accent/10 text-terminal-accent border border-terminal-accent/30 mt-0.5">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold font-mono text-white tracking-tight">
                Active Analysis Target: {activeFilename}
              </h3>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-semibold ${
                  isDefault
                    ? 'bg-blue-950/80 text-blue-400 border border-blue-700/60'
                    : 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/60'
                }`}
              >
                {isDefault ? 'Default Synthetic Data' : 'Custom Upload'}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Historical coverage: <span className="text-slate-300 font-semibold">{earliestDate}</span> to{' '}
              <span className="text-slate-300 font-semibold">{mostRecentDate}</span> •{' '}
              <span className="text-terminal-accent">{validObservations}</span> cleaned observations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-center">
          <button
            onClick={onNavigateToPredict}
            className="px-3.5 py-2 rounded-lg bg-terminal-accent/10 hover:bg-terminal-accent/20 border border-terminal-accent/30 text-terminal-accent text-xs font-mono font-semibold transition-colors flex items-center gap-1.5"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Predict Trend</span>
          </button>
          <button
            onClick={onNavigateToCharts}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-medium transition-colors"
          >
            Explore Charts
          </button>
        </div>
      </div>

      {/* Insufficient data warning if valid observations < 20 */}
      {!summary?.has_sufficient_data && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-amber-200 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs font-mono">
            <span className="font-semibold text-amber-300">Insufficient Observations Warning:</span>{' '}
            {summary?.message || 'Dataset contains fewer than 20 rows. 10-day and 20-day moving averages require more data.'}
          </div>
        </div>
      )}

      {/* 7 Key Summary Cards required by prompt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Latest Closing Price */}
        <StatCard
          title="Latest Close Price"
          value={latestClose !== null && latestClose !== undefined ? `$${latestClose.toFixed(2)}` : null}
          change={priceChangePct}
          changeSuffix="%"
          icon={DollarSign}
          subtext={`Observed on ${mostRecentDate}`}
        />

        {/* 2. Previous Closing Price & Price Change */}
        <StatCard
          title="Previous Close / Change"
          value={previousClose !== null && previousClose !== undefined ? `$${previousClose.toFixed(2)}` : null}
          change={priceChange}
          changeSuffix=" pts"
          icon={priceChange !== null && priceChange !== undefined && priceChange >= 0 ? ArrowUpRight : ArrowDownRight}
          subtext={
            priceChange !== null && priceChange !== undefined
              ? `${priceChange >= 0 ? '+' : ''}$${priceChange.toFixed(2)} vs previous session`
              : 'Previous session unavailable'
          }
        />

        {/* 3. Latest Daily Return */}
        <StatCard
          title="Latest Daily Return"
          value={dailyReturn !== null ? `${dailyReturn >= 0 ? '+' : ''}${dailyReturn.toFixed(2)}%` : '—'}
          change={dailyReturn}
          changeSuffix="%"
          icon={Percent}
          subtext="Single-session percentage change"
        />

        {/* 4. Latest 10-Day Moving Average */}
        <StatCard
          title="10-Day Moving Average"
          value={ma10 !== null && ma10 !== undefined ? `$${ma10.toFixed(2)}` : 'N/A'}
          icon={Activity}
          subtext={
            latestClose && ma10
              ? `${latestClose >= ma10 ? 'Bullish' : 'Bearish'} (${((latestClose / ma10 - 1) * 100).toFixed(1)}% vs MA10)`
              : 'Requires 10 sessions'
          }
        />

        {/* 5. Latest 20-Day Moving Average */}
        <StatCard
          title="20-Day Moving Average"
          value={ma20 !== null && ma20 !== undefined ? `$${ma20.toFixed(2)}` : 'N/A'}
          icon={Activity}
          subtext={
            latestClose && ma20
              ? `${latestClose >= ma20 ? 'Above MA20' : 'Below MA20'} (${((latestClose / ma20 - 1) * 100).toFixed(1)}%)`
              : 'Requires 20 sessions'
          }
        />

        {/* 6. Total Valid Observations */}
        <StatCard
          title="Valid Observations"
          value={validObservations.toLocaleString()}
          icon={Layers}
          subtext="Chronologically sorted records"
        />

        {/* 7. Most Recent Observation Date */}
        <StatCard
          title="Most Recent Date"
          value={mostRecentDate}
          icon={Calendar}
          subtext={`First: ${earliestDate}`}
        />

        {/* Trend Indicator Preview */}
        <div className="terminal-card p-5 hover:border-slate-700 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Market Stance
            </span>
            <div className="p-2 rounded-lg bg-slate-800 text-terminal-accent border border-slate-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span
              className={`text-lg font-bold font-mono px-3 py-1 rounded-md inline-block border ${
                latestClose && ma20 && latestClose >= ma20
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/40'
                  : 'bg-red-950/40 text-red-400 border-red-500/40'
              }`}
            >
              {latestClose && ma20 && latestClose >= ma20 ? 'PRICE > MA20' : 'PRICE < MA20'}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-2">
            Click 'Predict Trend' for ML Direction
          </div>
        </div>
      </div>

      {/* Recent Price Chart Preview (Last 60 sessions) */}
      <div className="terminal-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-2">
          <div>
            <h3 className="text-sm font-bold font-mono text-white tracking-tight">
              Recent Price Trajectory (Last 60 Observations)
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Closing price trend with 10-day & 20-day smoothed moving averages
            </p>
          </div>
          <button
            onClick={onNavigateToCharts}
            className="text-xs font-mono text-terminal-accent hover:underline flex items-center gap-1 self-start sm:self-center"
          >
            <span>Full Chart Explorer</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="h-72 mt-4 w-full">
          {isLoadingChart ? (
            <LoadingSpinner message="Rendering chart preview..." className="h-full" />
          ) : recentChartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs font-mono text-slate-500">
              No chart observations available for this dataset.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashboardCloseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="Date"
                  stroke="#475569"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                  tickFormatter={(val: string) => val.slice(5)}
                  minTickGap={25}
                />
                <YAxis
                  stroke="#475569"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                  domain={['auto', 'auto']}
                  tickFormatter={(val: number) => `$${val.toFixed(0)}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(value: any, name: any) => [
                    `$${Number(value).toFixed(2)}`,
                    name === 'Close' ? 'Closing Price' : name === 'MA10' ? '10-Day MA' : '20-Day MA',
                  ]}
                  labelFormatter={(lbl: any) => `Date: ${lbl}`}
                />
                <Area
                  type="monotone"
                  dataKey="Close"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#dashboardCloseGradient)"
                  name="Close"
                />
                <Area
                  type="monotone"
                  dataKey="MA10"
                  stroke="#10b981"
                  strokeWidth={1.5}
                  strokeDasharray="4 4"
                  fill="none"
                  name="MA10"
                />
                <Area
                  type="monotone"
                  dataKey="MA20"
                  stroke="#f59e0b"
                  strokeWidth={1.5}
                  strokeDasharray="2 2"
                  fill="none"
                  name="MA20"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
