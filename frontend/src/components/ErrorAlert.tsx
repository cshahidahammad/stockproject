import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'Data Retrieval Error',
  message,
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-red-500/30 bg-red-950/20 p-4 text-red-200 flex items-start space-x-3 backdrop-blur-sm ${className}`}
    >
      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 text-sm">
        <h4 className="font-semibold text-red-300 font-mono tracking-tight">{title}</h4>
        <p className="mt-1 text-red-300/80 leading-relaxed">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-800/50 text-red-200 text-xs font-mono font-medium border border-red-700/50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        )}
      </div>
    </div>
  );
};
