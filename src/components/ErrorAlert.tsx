import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorAlertProps {
  message: string | null;
  onDismiss: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="rounded-xl bg-red-950/80 border border-red-500/30 p-4 text-red-200 text-xs flex items-start justify-between gap-3 shadow-lg animate-fadeIn">
      <div className="flex items-start space-x-2.5">
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-red-300">Analysis Exception / Input Validation Error</span>
          <p className="text-red-200/90 leading-relaxed">{message}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="p-1 rounded hover:bg-red-900/50 text-red-400 hover:text-red-200 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
