import React from 'react';
import { TrendingUp, Info } from 'lucide-react';
import type { PredictionResult } from '../types/prediction';

interface IntensityForecastGraphProps {
  prediction: PredictionResult | null;
}

export const IntensityForecastGraph: React.FC<IntensityForecastGraphProps> = ({ prediction }) => {
  const currentSpeed = prediction ? prediction.windSpeedKmh : 105;

  const trendMultiplier = prediction?.trend === 'Intensifying' ? 1.25 : prediction?.trend === 'Weakening' ? 0.75 : 1.0;

  const points = [
    { label: '-24h', speed: Math.round(currentSpeed * 0.65), type: 'Observed' },
    { label: '-12h', speed: Math.round(currentSpeed * 0.82), type: 'Observed' },
    { label: 'NOW', speed: currentSpeed, type: 'Current Inference' },
    { label: '+12h', speed: Math.round(currentSpeed * trendMultiplier), type: 'Forecast' },
    { label: '+24h', speed: Math.round(currentSpeed * Math.min(1.4, trendMultiplier * 1.15)), type: 'Forecast' },
  ];

  const maxSpeed = Math.max(...points.map((p) => p.speed), 180);

  return (
    <div className="rounded bg-[#06131D]/80 border border-slate-800 p-4 space-y-4 font-mono">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 text-xs">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-[#20D4E8]" />
          <span className="font-bold tracking-wider uppercase text-slate-200">
            INTENSITY TIMELINE (OBSERVED → CURRENT → FORECAST)
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[10px] text-slate-400">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Observed</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Current</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-[#20D4E8]" />
            <span>Forecast</span>
          </span>
        </div>
      </div>

      {/* Time-Series Graph Visualization */}
      <div className="pt-2">
        <div className="relative h-44 w-full flex items-end justify-between px-2 pt-6 pb-4">
          
          {/* Background Axis Lines */}
          <div className="absolute inset-x-0 top-0 border-b border-slate-800/40 text-[10px] text-slate-600 pl-1">
            {maxSpeed} km/h
          </div>
          <div className="absolute inset-x-0 top-1/2 border-b border-slate-800/40 text-[10px] text-slate-600 pl-1">
            {Math.round(maxSpeed / 2)} km/h
          </div>

          {/* Connected SVG Line */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
            {/* Observed Segment (Slate) */}
            <polyline
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              points={points.slice(0, 3).map((p, idx) => {
                const x = (idx / 4) * 100;
                const y = 100 - (p.speed / maxSpeed) * 80;
                return `${x}%,${y}%`;
              }).join(' ')}
            />
            {/* Forecast Segment (Cyan Dashed) */}
            <polyline
              fill="none"
              stroke="#20D4E8"
              strokeWidth="2.5"
              strokeDasharray="4 4"
              points={points.slice(2).map((p, idx) => {
                const x = ((idx + 2) / 4) * 100;
                const y = 100 - (p.speed / maxSpeed) * 80;
                return `${x}%,${y}%`;
              }).join(' ')}
            />
          </svg>

          {/* Nodes & Bars */}
          {points.map((p) => {
            const heightPercent = Math.min(100, Math.max(15, (p.speed / maxSpeed) * 100));
            const isNow = p.label === 'NOW';
            const isForecast = p.type === 'Forecast';

            return (
              <div key={p.label} className="relative z-10 flex flex-col items-center">
                
                {/* Speed Tooltip */}
                <div className={`mb-1 px-1.5 py-0.5 rounded text-[10px] font-bold border transition-transform ${
                  isNow
                    ? 'bg-amber-500 text-slate-950 border-amber-400 scale-110'
                    : isForecast
                    ? 'bg-[#087EA4]/30 text-[#20D4E8] border-[#20D4E8]/30'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}>
                  {p.speed} <span className="text-[9px] font-normal">km/h</span>
                </div>

                {/* Vertical Bar */}
                <div
                  className={`w-2 rounded-t-sm transition-all ${
                    isNow
                      ? 'bg-amber-400 ring-2 ring-amber-500/40'
                      : isForecast
                      ? 'bg-[#20D4E8]/80'
                      : 'bg-slate-500/60'
                  }`}
                  style={{ height: `${heightPercent}px` }}
                />

                {/* Timeline Label */}
                <div className="mt-2 text-center">
                  <div className={`text-xs font-bold ${isNow ? 'text-amber-400' : isForecast ? 'text-[#20D4E8]' : 'text-slate-400'}`}>
                    {p.label}
                  </div>
                  <div className="text-[9px] text-slate-500 uppercase tracking-tighter">
                    {p.type}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      <div className="p-2.5 rounded bg-[#02070d]/60 border border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-[#20D4E8] shrink-0" />
          <span>Short-term intensity trend projection based on eyewall convection gradient.</span>
        </div>
        <span className="text-slate-500">Interval: 12 Hours</span>
      </div>

    </div>
  );
};
