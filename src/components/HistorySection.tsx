import React from 'react';
import { History, Calendar, Layers, ChevronRight, RefreshCw, Database } from 'lucide-react';
import type { HistoryItem } from '../types/prediction';
import { getCategoryInfo } from '../data/cycloneCategories';
import { EmptyState } from './EmptyState';

interface HistorySectionProps {
  history: HistoryItem[];
  onRefresh?: () => void;
  onSelectHistoryItem?: (item: HistoryItem) => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  history,
  onRefresh,
  onSelectHistoryItem,
}) => {
  return (
    <div className="rounded-2xl glass-panel p-5 sm:p-6 space-y-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
            <History className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Recent Analyses History</h3>
            <p className="text-xs text-slate-400">
              Structured to connect directly with the future <code className="text-cyan-400 bg-slate-900 px-1 py-0.5 rounded">/history</code> API
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors text-xs cursor-pointer"
            title="Refresh History"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* History Items or Empty State */}
      {history.length === 0 ? (
        <EmptyState
          icon={Database}
          title="No Analyses Recorded Yet"
          description="Your previous cyclone classification runs will automatically be logged here for audit and historical trend tracking."
        />
      ) : (
        <div className="space-y-2.5">
          {history.map((item) => {
            const categoryInfo = getCategoryInfo(item.category);

            return (
              <div
                key={item.id}
                onClick={() => onSelectHistoryItem?.(item)}
                className="p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Left: Title & Timestamp */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {item.cycloneName || `Analysis ${item.id}`}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${categoryInfo.badgeBg}`}>
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3 text-xs text-slate-400">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{item.date}</span>
                    </span>
                    <span className="flex items-center space-x-1 font-mono">
                      <Layers className="w-3 h-3 text-slate-500" />
                      <span>{item.sourcesUsed}</span>
                    </span>
                  </div>
                </div>

                {/* Right: Stats & Chevron */}
                <div className="flex items-center justify-between sm:justify-end space-x-4 border-t sm:border-t-0 border-slate-800/60 pt-2 sm:pt-0">
                  <div className="flex items-center space-x-4 text-xs font-mono">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Wind</div>
                      <div className="font-semibold text-slate-200">{item.windSpeedKmh} km/h</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">Confidence</div>
                      <div className="font-semibold text-cyan-400">{item.confidence.toFixed(1)}%</div>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
