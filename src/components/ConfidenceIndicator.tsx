import React from 'react';
import { Gauge } from 'lucide-react';

import type { SatelliteSourceType } from '../types/prediction';

interface ConfidenceIndicatorProps {
  confidence: number; // 0 - 100
  featureScores?: {
    eyeStructure?: number;
    cloudBandSymmetry?: number;
    brightnessTemperatureGradient?: number;
    waterVapourConvection?: number;
  };
  sourcesUsed: SatelliteSourceType | string;
}

export const ConfidenceIndicator: React.FC<ConfidenceIndicatorProps> = ({
  confidence,
  featureScores,
  sourcesUsed,
}) => {
  return (
    <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-4 space-y-3 font-mono">
      
      {/* Header */}
      <div className="flex items-center justify-between text-xs border-b border-slate-800/60 pb-2">
        <div className="flex items-center space-x-1.5 text-slate-300">
          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold tracking-wider uppercase">MODEL CONFIDENCE</span>
        </div>
      </div>

      {/* Main Score & Compact Bar */}
      <div>
        <div className="flex items-baseline justify-between mb-1">
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-extrabold text-white">{confidence.toFixed(1)}</span>
            <span className="text-sm font-bold text-cyan-400">%</span>
          </div>
          <span className="text-[10px] text-slate-500">
            {sourcesUsed.includes('WV') || sourcesUsed.includes('+') ? 'Multi-Channel Weighting' : 'Single Channel Weighting'}
          </span>
        </div>

        {/* Compact Progress Indicator */}
        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              confidence >= 90
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-400'
                : 'bg-cyan-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, confidence))}%` }}
          />
        </div>
      </div>

      {/* Sub Feature Metrics Breakdown */}
      {featureScores && (
        <div className="pt-2 border-t border-slate-800/60 grid grid-cols-2 gap-2 text-[10px]">
          {featureScores.eyeStructure !== undefined && (
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/40 border border-slate-800/40">
              <span className="text-slate-400">Eye Structure</span>
              <span className="font-bold text-slate-200">{featureScores.eyeStructure.toFixed(1)}%</span>
            </div>
          )}

          {featureScores.cloudBandSymmetry !== undefined && (
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/40 border border-slate-800/40">
              <span className="text-slate-400">Cloud Banding</span>
              <span className="font-bold text-slate-200">{featureScores.cloudBandSymmetry.toFixed(1)}%</span>
            </div>
          )}

          {featureScores.brightnessTemperatureGradient !== undefined && (
            <div className="flex items-center justify-between p-1.5 rounded bg-slate-900/40 border border-slate-800/40">
              <span className="text-slate-400">TIR Gradient</span>
              <span className="font-bold text-slate-200">{featureScores.brightnessTemperatureGradient.toFixed(1)}%</span>
            </div>
          )}

          {sourcesUsed === 'IR + WV' && featureScores.waterVapourConvection !== undefined && (
            <div className="flex items-center justify-between p-1.5 rounded bg-indigo-950/40 border border-indigo-500/20">
              <span className="text-indigo-300">WV Moisture Sync</span>
              <span className="font-bold text-indigo-200">{featureScores.waterVapourConvection.toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
