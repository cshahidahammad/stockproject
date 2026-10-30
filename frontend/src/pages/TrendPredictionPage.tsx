import React, { useEffect, useState, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Cpu,
  Download,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  BarChart,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';
import { api } from '../services/api';
import { PredictionResult } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';

export const TrendPredictionPage: React.FC = () => {
  const { currentDatasetId, activeFilename } = useDataset();

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = useCallback(async (recompute: boolean = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = recompute
        ? await api.predictDatasetTrend(currentDatasetId)
        : await api.getDatasetEvaluation(currentDatasetId);
      setPrediction(data);
    } catch (err: any) {
      setError(err.message || 'Model execution failed');
    } finally {
      setIsLoading(false);
    }
  }, [currentDatasetId]);

  useEffect(() => {
    fetchPrediction(false);
  }, [fetchPrediction]);

  const isUp = prediction?.predicted_trend === 'UP';

  return (
    <div className="space-y-6">
      {/* Top Banner and Model Execution Action */}
      <div className="terminal-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-terminal-accent" />
            <h3 className="text-base font-bold font-mono text-white tracking-tight">
              Logistic Regression Trend Classifier
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Chronological 80/20 train/test split • Target: Next observation close &gt; current close
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => fetchPrediction(true)}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-terminal-accent/10 hover:bg-terminal-accent/20 border border-terminal-accent/40 text-terminal-accent text-xs font-mono font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Retrain Model</span>
          </button>

          <a
            href={api.getDownloadEvaluationUrl(currentDatasetId)}
            download
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Evaluation JSON</span>
          </a>

          <a
            href={api.getDownloadPredictionUrl(currentDatasetId)}
            download
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-mono transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>Prediction JSON</span>
          </a>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => fetchPrediction(true)} />}

      {isLoading ? (
        <LoadingSpinner message="Fitting StandardScaler & Logistic Regression on chronological training data..." className="py-24" />
      ) : prediction ? (
        <>
          {/* Main Prediction Display Card */}
          <div
            className={`terminal-card p-6 border-l-4 transition-colors ${
              isUp ? 'border-l-emerald-500 bg-emerald-950/10' : 'border-l-red-500 bg-red-950/10'
            }`}
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Forecast for Observation Following {prediction.latest_eligible_date}
                </span>

                <div className="flex items-center space-x-4">
                  <div
                    className={`p-3 rounded-xl border flex items-center justify-center ${
                      isUp
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}
                  >
                    {isUp ? <TrendingUp className="w-8 h-8" /> : <TrendingDown className="w-8 h-8" />}
                  </div>

                  <div>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-xs font-mono text-slate-400">Predicted Direction:</span>
                      <span
                        className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
                          isUp ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {prediction.predicted_trend}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">
                      {isUp
                        ? 'Model projects next closing price will be strictly higher than current close.'
                        : 'Model projects next closing price will be equal or lower than current close.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price & Target context card */}
              <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl font-mono text-xs">
                <div>
                  <div className="text-slate-400">Latest Known Close</div>
                  <div className="text-lg font-bold text-white mt-0.5">
                    ${prediction.latest_close.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-slate-500">{prediction.latest_eligible_date}</div>
                </div>
                <div className="h-10 w-px bg-slate-800" />
                <div>
                  <div className="text-slate-400">Target Definition</div>
                  <div className="text-slate-200 font-semibold mt-0.5">Next Close &gt; Current</div>
                  <div className="text-[11px] text-slate-500">Binary Direction (1 vs 0)</div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-terminal-accent" />
              <span>{prediction.note}</span>
            </div>
          </div>

          {/* Evaluation Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="terminal-card p-5">
              <div className="text-xs font-mono uppercase text-slate-400">Test Set Accuracy</div>
              <div className="text-2xl font-bold font-mono text-white mt-2">
                {(prediction.accuracy * 100).toFixed(2)}%
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-terminal-accent h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, prediction.accuracy * 100)}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-2">
                Overall correct direction rate
              </div>
            </div>

            <div className="terminal-card p-5">
              <div className="text-xs font-mono uppercase text-slate-400">Precision (Upward)</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
                {(prediction.precision * 100).toFixed(2)}%
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, prediction.precision * 100)}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-2">
                When predicted UP, true positive rate
              </div>
            </div>

            <div className="terminal-card p-5">
              <div className="text-xs font-mono uppercase text-slate-400">Recall (Sensitivity)</div>
              <div className="text-2xl font-bold font-mono text-blue-400 mt-2">
                {(prediction.recall * 100).toFixed(2)}%
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, prediction.recall * 100)}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-2">
                Percentage of actual UP days captured
              </div>
            </div>

            <div className="terminal-card p-5">
              <div className="text-xs font-mono uppercase text-slate-400">F1-Score</div>
              <div className="text-2xl font-bold font-mono text-purple-400 mt-2">
                {(prediction.f1_score * 100).toFixed(2)}%
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, prediction.f1_score * 100)}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-2">
                Harmonic mean of precision & recall
              </div>
            </div>
          </div>

          {/* Confusion Matrix and Dataset Split Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confusion Matrix Card */}
            <div className="terminal-card p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
                <h4 className="text-sm font-bold font-mono text-white tracking-tight flex items-center gap-2">
                  <BarChart className="w-4 h-4 text-terminal-accent" />
                  <span>Chronological Holdout Confusion Matrix</span>
                </h4>
                <span className="text-xs font-mono text-slate-400">
                  {prediction.test_rows} Holdout Sessions
                </span>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 text-slate-500 font-semibold flex items-center justify-center">
                    Actual \ Predicted
                  </div>
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded font-semibold text-slate-300">
                    Pred: DOWN / FLAT (0)
                  </div>
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded font-semibold text-slate-300">
                    Pred: UPWARD (1)
                  </div>

                  {/* Row 0: Actual Down/Flat */}
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded font-semibold text-slate-300 flex items-center justify-center">
                    Actual: DOWN (0)
                  </div>
                  <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded">
                    <div className="text-base font-bold text-emerald-400 font-mono">
                      {prediction.confusion_matrix[0][0]}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">True Negative (TN)</div>
                  </div>
                  <div className="p-3 bg-red-950/30 border border-red-800/40 rounded">
                    <div className="text-base font-bold text-red-400 font-mono">
                      {prediction.confusion_matrix[0][1]}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">False Positive (FP)</div>
                  </div>

                  {/* Row 1: Actual Upward */}
                  <div className="p-2 bg-slate-900 border border-slate-800 rounded font-semibold text-slate-300 flex items-center justify-center">
                    Actual: UP (1)
                  </div>
                  <div className="p-3 bg-red-950/30 border border-red-800/40 rounded">
                    <div className="text-base font-bold text-red-400 font-mono">
                      {prediction.confusion_matrix[1][0]}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">False Negative (FN)</div>
                  </div>
                  <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded">
                    <div className="text-base font-bold text-emerald-400 font-mono">
                      {prediction.confusion_matrix[1][1]}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">True Positive (TP)</div>
                  </div>
                </div>

                <p className="text-[11px] font-mono text-slate-400">
                  Rows represent true market outcomes; columns represent Logistic Regression classifications on unseen chronological holdout sessions.
                </p>
              </div>
            </div>

            {/* Split and Features Details */}
            <div className="terminal-card p-6 space-y-4">
              <div className="pb-4 border-b border-slate-800/80">
                <h4 className="text-sm font-bold font-mono text-white tracking-tight flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-terminal-accent" />
                  <span>Dataset Split & Feature Engineering</span>
                </h4>
              </div>

              <div className="space-y-3 text-xs font-mono">
                <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-400">Training Partition (First 80%):</span>
                  <span className="font-semibold text-white">{prediction.training_rows} observations</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-400">Testing Partition (Last 20%):</span>
                  <span className="font-semibold text-white">{prediction.test_rows} observations</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-400">Test Period Range:</span>
                  <span className="font-semibold text-slate-300">
                    {prediction.test_start_date} to {prediction.test_end_date}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-800/50">
                  <span className="text-slate-400">Class Balance (Down / Up):</span>
                  <span className="font-semibold text-slate-300">
                    {prediction.target_class_distribution.downward_or_flat} Down vs{' '}
                    {prediction.target_class_distribution.upward} Up
                  </span>
                </div>

                <div className="pt-2">
                  <span className="text-slate-400 block mb-2">Model Feature Columns:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {prediction.feature_names.map((feat) => (
                      <span
                        key={feat}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] text-terminal-accent"
                      >
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Model Limitations and Financial Disclaimer */}
          <div className="terminal-card p-6 border-l-4 border-l-amber-500/80 bg-amber-950/10">
            <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-amber-500/20">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h4 className="text-sm font-bold font-mono text-amber-300 tracking-tight">
                Model Constraints & Financial Disclaimer
              </h4>
            </div>

            <ul className="space-y-2 text-xs font-mono text-amber-200/80 list-disc list-inside leading-relaxed">
              {prediction.limitations.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </>
      ) : null}
    </div>
  );
};
