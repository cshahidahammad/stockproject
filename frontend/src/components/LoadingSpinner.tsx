import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Processing financial data...',
  className = 'py-12',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <Loader2 className="w-8 h-8 text-terminal-accent animate-spin" />
      <span className="text-sm font-medium text-slate-400 font-mono tracking-wide">{message}</span>
    </div>
  );
};
