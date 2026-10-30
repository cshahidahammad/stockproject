import React, { useEffect, useState, useCallback } from 'react';
import {
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  BarChart2,
  ArrowUpDown,
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';
import { api } from '../services/api';
import { StockAnalysisResponse, StockRow } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';

export const StockAnalysisPage: React.FC = () => {
  const { currentDatasetId, activeFilename } = useDataset();

  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const [analysisData, setAnalysisData] = useState<StockAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getDatasetAnalysis(currentDatasetId, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        pageSize,
      });
      setAnalysisData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load stock analysis data');
    } finally {
      setIsLoading(false);
    }
  }, [currentDatasetId, startDate, endDate, page, pageSize]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const handleQuickRange = (months: number) => {
    if (!analysisData?.data?.length && !startDate && !endDate) return;
    // Calculate relative to latest date in dataset or now
    const now = new Date();
    const past = new Date(now);
    past.setMonth(past.getMonth() - months);
    setStartDate(past.toISOString().slice(0, 10));
    setEndDate(now.toISOString().slice(0, 10));
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Controls Bar */}
      <div className="terminal-card p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Date range pickers */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono">
              <Calendar className="w-3.5 h-3.5 text-terminal-accent" />
              <span className="text-slate-400">Start:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-slate-200 outline-none focus:text-white"
              />
            </div>

            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-1.5 text-xs font-mono">
              <Calendar className="w-3.5 h-3.5 text-terminal-accent" />
              <span className="text-slate-400">End:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-slate-200 outline-none focus:text-white"
              />
            </div>

            {(startDate || endDate) && (
              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 border border-slate-700 transition-colors"
              >
                Clear Filter
              </button>
            )}
          </div>

          {/* Rows per page & Download */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-terminal-accent font-mono"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <a
              href={api.getDownloadProcessedUrl(currentDatasetId)}
              download
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-terminal-accent" />
              <span>Export CSV</span>
            </a>
          </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={fetchAnalysis} />}

      {/* Statistical Summary Panel */}
      {analysisData?.summary_stats && (
        <div className="terminal-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
            <div className="flex items-center space-x-2 text-xs font-bold font-mono uppercase tracking-wider text-slate-300">
              <BarChart2 className="w-4 h-4 text-terminal-accent" />
              <span>Statistical Distribution (Close & Volume)</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Filtered Records: {analysisData.filtered_records.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-2 px-3">Metric</th>
                  <th className="py-2 px-3">Count</th>
                  <th className="py-2 px-3">Mean</th>
                  <th className="py-2 px-3">Std Dev</th>
                  <th className="py-2 px-3">Min</th>
                  <th className="py-2 px-3">25% (Q1)</th>
                  <th className="py-2 px-3">50% (Median)</th>
                  <th className="py-2 px-3">75% (Q3)</th>
                  <th className="py-2 px-3">Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {Object.entries(analysisData.summary_stats).map(([col, stats]) => (
                  <tr key={col} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 font-semibold text-terminal-accent">{col}</td>
                    <td className="py-2 px-3">{stats.count ? stats.count.toFixed(0) : '—'}</td>
                    <td className="py-2 px-3">
                      {col === 'Close' ? `$${stats.mean?.toFixed(2)}` : stats.mean?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-2 px-3">
                      {col === 'Close' ? `$${stats.std?.toFixed(2)}` : stats.std?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-2 px-3">
                      {col === 'Close' ? `$${stats.min?.toFixed(2)}` : stats.min?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-2 px-3">
                      {col === 'Close' ? `$${stats['25%']?.toFixed(2)}` : stats['25%']?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-2 px-3 font-semibold text-white">
                      {col === 'Close' ? `$${stats['50%']?.toFixed(2)}` : stats['50%']?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-2 px-3">
                      {col === 'Close' ? `$${stats['75%']?.toFixed(2)}` : stats['75%']?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-2 px-3">
                      {col === 'Close' ? `$${stats.max?.toFixed(2)}` : stats.max?.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historical Data Table */}
      <div className="terminal-card overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="text-xs font-bold font-mono text-white tracking-tight">
            Historical Records with Derived Indicators
          </div>
          <div className="text-xs font-mono text-slate-400">
            Page {analysisData?.page || 1} of {analysisData?.total_pages || 1} ({analysisData?.filtered_records || 0} total)
          </div>
        </div>

        {isLoading ? (
          <LoadingSpinner message="Loading historical records..." className="py-16" />
        ) : !analysisData?.data?.length ? (
          <div className="p-12 text-center text-xs font-mono text-slate-400">
            No stock records found matching the selected date filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 select-none">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Open</th>
                  <th className="py-2.5 px-3">High</th>
                  <th className="py-2.5 px-3">Low</th>
                  <th className="py-2.5 px-3 font-bold text-white">Close</th>
                  <th className="py-2.5 px-3">Volume</th>
                  <th className="py-2.5 px-3">Daily Return</th>
                  <th className="py-2.5 px-3">MA10</th>
                  <th className="py-2.5 px-3">MA20</th>
                  <th className="py-2.5 px-3">Next Close</th>
                  <th className="py-2.5 px-3">Target Trend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-200">
                {analysisData.data.map((row: StockRow, idx: number) => {
                  const dailyRet = row.Daily_Return !== null ? row.Daily_Return * 100 : null;
                  return (
                    <tr key={idx} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-2 px-3 font-medium text-slate-300 whitespace-nowrap">{row.Date}</td>
                      <td className="py-2 px-3">${row.Open.toFixed(2)}</td>
                      <td className="py-2 px-3 text-emerald-400/90">${row.High.toFixed(2)}</td>
                      <td className="py-2 px-3 text-red-400/90">${row.Low.toFixed(2)}</td>
                      <td className="py-2 px-3 font-bold text-white">${row.Close.toFixed(2)}</td>
                      <td className="py-2 px-3 text-slate-400">{row.Volume.toLocaleString()}</td>
                      <td className="py-2 px-3">
                        {dailyRet !== null ? (
                          <span
                            className={`font-semibold ${
                              dailyRet > 0
                                ? 'text-emerald-400'
                                : dailyRet < 0
                                ? 'text-red-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {dailyRet > 0 ? '+' : ''}
                            {dailyRet.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-emerald-300/80">
                        {row.MA10 !== null ? `$${row.MA10.toFixed(2)}` : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-2 px-3 text-amber-300/80">
                        {row.MA20 !== null ? `$${row.MA20.toFixed(2)}` : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-2 px-3 text-slate-300">
                        {row.Next_Close !== null ? `$${row.Next_Close.toFixed(2)}` : <span className="text-slate-600 font-italic">Unobserved</span>}
                      </td>
                      <td className="py-2 px-3">
                        {row.Trend !== null ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.Trend === 1
                                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50'
                                : 'bg-red-950/60 text-red-400 border border-red-800/50'
                            }`}
                          >
                            {row.Trend === 1 ? 'UP (1)' : 'DOWN/FLAT (0)'}
                          </span>
                        ) : (
                          <span className="text-slate-600 font-italic text-[10px]">Forecast target</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {analysisData && analysisData.total_pages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/40">
            <div className="text-xs font-mono text-slate-400">
              Showing {(analysisData.page - 1) * analysisData.page_size + 1} to{' '}
              {Math.min(analysisData.page * analysisData.page_size, analysisData.filtered_records)} of{' '}
              {analysisData.filtered_records} observations
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
                title="Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 text-xs font-mono text-slate-300">
                Page {page} / {analysisData.total_pages}
              </span>

              <button
                disabled={page >= analysisData.total_pages}
                onClick={() => setPage((p) => Math.min(analysisData.total_pages, p + 1))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
                title="Next Page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                disabled={page >= analysisData.total_pages}
                onClick={() => setPage(analysisData.total_pages)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
