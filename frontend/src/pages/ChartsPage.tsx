import React, { useEffect, useState, useCallback } from 'react';
import {
  Calendar,
  Filter,
  LineChart as LineChartIcon,
  BarChart3,
  Activity,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { useDataset } from '../context/DatasetContext';
import { api } from '../services/api';
import { ChartDataPoint } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';

export const ChartsPage: React.FC = () => {
  const { currentDatasetId, activeFilename } = useDataset();

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCharts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getDatasetCharts(currentDatasetId, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setChartData(res.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load chart data');
    } finally {
      setIsLoading(false);
    }
  }, [currentDatasetId, startDate, endDate]);

  useEffect(() => {
    fetchCharts();
  }, [fetchCharts]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
  };

  const handlePreset = (months: number) => {
    if (chartData.length === 0) return;
    const lastDateStr = chartData[chartData.length - 1].Date;
    const lastDate = new Date(lastDateStr);
    const past = new Date(lastDate);
    past.setMonth(past.getMonth() - months);
    setStartDate(past.toISOString().slice(0, 10));
    setEndDate(lastDateStr);
  };

  return (
    <div className="space-y-6">
      {/* Date Range Filtering Toolbar */}
      <div className="terminal-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
            <LineChartIcon className="w-4 h-4 text-terminal-accent" />
            <span>Interactive Chart Visualizer</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono">
              <Calendar className="w-3.5 h-3.5 text-terminal-accent" />
              <span className="text-slate-400">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-slate-200 outline-none focus:text-white"
              />
            </div>

            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono">
              <Calendar className="w-3.5 h-3.5 text-terminal-accent" />
              <span className="text-slate-400">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-slate-200 outline-none focus:text-white"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono">
              <button
                onClick={() => handlePreset(3)}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
              >
                3M
              </button>
              <button
                onClick={() => handlePreset(6)}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
              >
                6M
              </button>
              <button
                onClick={() => handlePreset(12)}
                className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
              >
                1Y
              </button>
              {(startDate || endDate) && (
                <button
                  onClick={handleResetFilters}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-terminal-accent border border-slate-700 transition-colors"
                >
                  All
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchCharts} />}

      {isLoading ? (
        <LoadingSpinner message="Querying time-series dataset..." className="py-24" />
      ) : chartData.length === 0 ? (
        <div className="terminal-card p-12 text-center text-xs font-mono text-slate-400">
          No records found for the specified date range.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Chart 1: Closing Price with MA10 & MA20 */}
          <div className="terminal-card p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div>
                <h4 className="text-sm font-bold font-mono text-white tracking-tight">
                  1. Closing Price with 10-Day & 20-Day Moving Averages
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  Trend overlay displaying price trajectory against short-term smoothed indicators
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400 hidden sm:inline">
                {chartData.length} Observations
              </span>
            </div>

            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                  <XAxis
                    dataKey="Date"
                    stroke="#475569"
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    minTickGap={35}
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
                    }}
                    formatter={(value: any, name: any) => [
                      `$${Number(value).toFixed(2)}`,
                      name === 'Close' ? 'Close' : name === 'MA10' ? 'MA10' : 'MA20',
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px', paddingTop: '10px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Close"
                    stroke="#38bdf8"
                    strokeWidth={2}
                    dot={false}
                    name="Close"
                  />
                  <Line
                    type="monotone"
                    dataKey="MA10"
                    stroke="#10b981"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                    name="MA10"
                  />
                  <Line
                    type="monotone"
                    dataKey="MA20"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    dot={false}
                    name="MA20"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Trading Volume */}
          <div className="terminal-card p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div>
                <h4 className="text-sm font-bold font-mono text-white tracking-tight">
                  2. Daily Trading Volume
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  Volume turnover distribution across historical trading sessions
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                  <XAxis
                    dataKey="Date"
                    stroke="#475569"
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    minTickGap={35}
                  />
                  <YAxis
                    stroke="#475569"
                    tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                    tickFormatter={(val: number) => `${(val / 1e6).toFixed(1)}M`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                    }}
                    formatter={(val: any) => [Number(val).toLocaleString(), 'Volume']}
                  />
                  <Bar dataKey="Volume" fill="#6366f1" radius={[2, 2, 0, 0]} opacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3 & 4 Grid: Daily Returns & High/Low Volatility Range */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Percentage Returns */}
            <div className="terminal-card p-6">
              <div className="pb-3 border-b border-slate-800/80 mb-4">
                <h4 className="text-sm font-bold font-mono text-white tracking-tight">
                  3. Daily Percentage Returns
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  Day-over-day return volatility (green = gain, red = loss)
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData.map((d) => ({
                      ...d,
                      ReturnPct: d.Daily_Return !== null ? d.Daily_Return * 100 : 0,
                    }))}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                    <ReferenceLine y={0} stroke="#475569" />
                    <XAxis
                      dataKey="Date"
                      stroke="#475569"
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                      minTickGap={30}
                    />
                    <YAxis
                      stroke="#475569"
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                      tickFormatter={(val: number) => `${val.toFixed(1)}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        borderColor: '#334155',
                        borderRadius: '8px',
                        fontFamily: 'monospace',
                        fontSize: '12px',
                      }}
                      formatter={(val: any) => [`${Number(val).toFixed(2)}%`, 'Daily Return']}
                    />
                    <Bar
                      dataKey="ReturnPct"
                      fill="#10b981"
                      opacity={0.85}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* High/Low Price Volatility Range */}
            <div className="terminal-card p-6">
              <div className="pb-3 border-b border-slate-800/80 mb-4">
                <h4 className="text-sm font-bold font-mono text-white tracking-tight">
                  4. Intraday Price Range (High vs Low)
                </h4>
                <p className="text-xs text-slate-400 font-mono">
                  Session volatility envelope spanning High and Low price extremes
                </p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
                    <XAxis
                      dataKey="Date"
                      stroke="#475569"
                      tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                      minTickGap={30}
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
                      }}
                      formatter={(val: any, name: any) => [`$${Number(val).toFixed(2)}`, name]}
                    />
                    <Legend
                      wrapperStyle={{ fontFamily: 'monospace', fontSize: '11px', paddingTop: '10px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="High"
                      stroke="#10b981"
                      strokeWidth={1.5}
                      dot={false}
                      name="High"
                    />
                    <Line
                      type="monotone"
                      dataKey="Close"
                      stroke="#38bdf8"
                      strokeWidth={2}
                      dot={false}
                      name="Close"
                    />
                    <Line
                      type="monotone"
                      dataKey="Low"
                      stroke="#ef4444"
                      strokeWidth={1.5}
                      dot={false}
                      name="Low"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
