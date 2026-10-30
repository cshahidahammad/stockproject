import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle,
  AlertCircle,
  Database,
  ArrowRight,
  RotateCcw,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';
import { api } from '../services/api';
import { UploadResponse } from '../types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorAlert } from '../components/ErrorAlert';

export const DataUploadPage: React.FC<{ onNavigateToDashboard: () => void }> = ({
  onNavigateToDashboard,
}) => {
  const {
    currentDatasetId,
    activeFilename,
    isDefault,
    recentDatasets,
    selectDataset,
    resetToDefault,
    addRecentDataset,
  } = useDataset();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    setUploadError(null);
    setUploadResult(null);

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Invalid file type: Only CSV files (.csv) are accepted.');
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the 10 MB limit.');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadAndProcess = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const res = await api.uploadDataset(selectedFile);
      setUploadResult(res);
      addRecentDataset({
        dataset_id: res.dataset_id,
        filename: res.filename,
        is_default: false,
      });
    } catch (err: any) {
      setUploadError(err.message || 'Dataset processing failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Info Header */}
      <div className="terminal-card p-6">
        <h3 className="text-sm font-bold font-mono text-white tracking-tight flex items-center gap-2">
          <UploadCloud className="w-5 h-5 text-terminal-accent" />
          <span>Upload Custom Historical Stock Dataset</span>
        </h3>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Upload any historical stock CSV to analyze indicators and predict trends. Datasets are isolated per session and never overwrite the default demonstration dataset.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="text-slate-300 font-semibold">Required Columns:</span>
          {['Date', 'Open', 'High', 'Low', 'Close', 'Volume'].map((col) => (
            <span
              key={col}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-terminal-accent"
            >
              {col}
            </span>
          ))}
          <span className="text-slate-500">(Case-insensitive, whitespace-trimmed)</span>
        </div>
      </div>

      {uploadError && <ErrorAlert title="CSV Validation Failed" message={uploadError} />}

      {/* Drag and Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`terminal-card p-8 border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
          dragActive
            ? 'border-terminal-accent bg-terminal-accent/5'
            : selectedFile
            ? 'border-emerald-500/50 bg-emerald-950/5'
            : 'border-slate-800 hover:border-slate-700 bg-slate-900/40'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="p-4 rounded-full bg-slate-800/80 border border-slate-700 text-terminal-accent mb-4">
          <UploadCloud className="w-8 h-8" />
        </div>

        {selectedFile ? (
          <div className="space-y-2">
            <div className="text-sm font-bold font-mono text-emerald-400 flex items-center justify-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{selectedFile.name}</span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              Size: {(selectedFile.size / 1024).toFixed(1)} KB • Ready for validation
            </p>
            <p className="text-[11px] font-mono text-slate-500">
              Click to choose a different CSV file
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-bold font-mono text-white">
              Drag & Drop your historical stock CSV here
            </p>
            <p className="text-xs font-mono text-slate-400">
              or <span className="text-terminal-accent underline">browse files</span> from your computer
            </p>
            <p className="text-[11px] font-mono text-slate-500">
              Supported format: .csv • Max size: 10 MB
            </p>
          </div>
        )}
      </div>

      {/* Action Button */}
      {selectedFile && !uploadResult && (
        <div className="flex justify-end">
          <button
            onClick={handleUploadAndProcess}
            disabled={isUploading}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-lg bg-terminal-accent text-slate-950 font-mono font-bold text-xs hover:bg-terminal-accent/90 transition-colors disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <LoadingSpinner message="Validating & Cleaning..." className="!py-0 !flex-row !space-y-0 !space-x-2 text-slate-950" />
              </>
            ) : (
              <>
                <span>Validate &amp; Process CSV</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Upload Success Preview */}
      {uploadResult && (
        <div className="terminal-card p-6 border-l-4 border-l-emerald-500 bg-emerald-950/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold font-mono text-white">
                  Dataset Successfully Validated and Registered
                </h4>
                <p className="text-xs font-mono text-emerald-300/80">
                  {uploadResult.valid_rows} clean, chronological records ready for analysis
                </p>
              </div>
            </div>

            <button
              onClick={onNavigateToDashboard}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-mono font-bold text-xs transition-colors self-start sm:self-center"
            >
              <span>Analyze This Dataset Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* First 5 Preview Rows */}
          {uploadResult.preview?.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-mono text-slate-400 mb-2">First 5 Cleaned Observations:</div>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900 text-slate-400">
                    <tr>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3">Open</th>
                      <th className="py-2 px-3">High</th>
                      <th className="py-2 px-3">Low</th>
                      <th className="py-2 px-3">Close</th>
                      <th className="py-2 px-3">Volume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {uploadResult.preview.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/40">
                        <td className="py-1.5 px-3">{row.Date}</td>
                        <td className="py-1.5 px-3">${Number(row.Open).toFixed(2)}</td>
                        <td className="py-1.5 px-3">${Number(row.High).toFixed(2)}</td>
                        <td className="py-1.5 px-3">${Number(row.Low).toFixed(2)}</td>
                        <td className="py-1.5 px-3 font-semibold text-white">${Number(row.Close).toFixed(2)}</td>
                        <td className="py-1.5 px-3">{Number(row.Volume).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Available Datasets / Session Registry */}
      <div className="terminal-card p-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-terminal-accent" />
            <h4 className="text-sm font-bold font-mono text-white">Session Datasets</h4>
          </div>

          {!isDefault && (
            <button
              onClick={resetToDefault}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-terminal-accent" />
              <span>Reset to Default Dataset</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          {recentDatasets.map((ds) => {
            const isCurrentlyActive = ds.dataset_id === currentDatasetId;
            return (
              <div
                key={ds.dataset_id}
                className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                  isCurrentlyActive
                    ? 'bg-slate-800/80 border-terminal-accent/50 text-white'
                    : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Database
                    className={`w-4 h-4 ${
                      isCurrentlyActive ? 'text-terminal-accent' : 'text-slate-500'
                    }`}
                  />
                  <div>
                    <div className="text-xs font-mono font-semibold text-slate-200 flex items-center gap-2">
                      <span>{ds.filename}</span>
                      {ds.is_default && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-950/60 text-blue-400 border border-blue-800/60 rounded">
                          Supplied Demonstration Data
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      ID: {ds.dataset_id}
                    </div>
                  </div>
                </div>

                {isCurrentlyActive ? (
                  <span className="text-xs font-mono text-terminal-accent font-semibold px-3 py-1 rounded bg-terminal-accent/10 border border-terminal-accent/30">
                    Active
                  </span>
                ) : (
                  <button
                    onClick={() => selectDataset(ds.dataset_id, ds.filename, ds.is_default)}
                    className="text-xs font-mono text-slate-300 hover:text-white px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
                  >
                    Select
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
