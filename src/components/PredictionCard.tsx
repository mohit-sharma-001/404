import React from 'react';
import { Wind, TrendingUp, TrendingDown, Minus, Layers, Clock, Cpu, Sparkles, RefreshCw, Activity } from 'lucide-react';
import type { AnalysisStatus, PredictionResult } from '../types/prediction';
import { getCategoryInfo } from '../data/cycloneCategories';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { IntensityForecastGraph } from './IntensityForecastGraph';
import { EmptyState } from './EmptyState';

interface PredictionCardProps {
  status: AnalysisStatus;
  prediction: PredictionResult | null;
  onReset?: () => void;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  status,
  prediction,
  onReset,
}) => {
  // 1. Analyzing State
  if (status === 'analyzing') {
    return (
      <div className="rounded-2xl glass-panel p-6 sm:p-8 relative overflow-hidden flex flex-col items-center justify-center text-center min-h-[380px]">
        {/* Ambient Pulsing Radar Background */}
        <div className="absolute inset-0 bg-radar-grid opacity-30 pointer-events-none" />
        <div className="absolute w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl animate-pulse-subtle pointer-events-none" />

        {/* Center Scanner Spinner */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-full border-2 border-slate-800 border-t-cyan-400 border-r-sky-400 animate-spin flex items-center justify-center" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Cpu className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
        </div>

        <h3 className="text-lg font-bold text-white mb-2 tracking-wide">
          Running Multi-spectral AI Analysis...
        </h3>

        <div className="space-y-1.5 max-w-sm text-xs text-slate-400 font-mono mb-6">
          <p className="flex items-center justify-center space-x-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>Processing Infrared & Moisture Matrices</span>
          </p>
          <p className="text-slate-400">Extracting eyewall gradient & cloud symmetry...</p>
        </div>

        {/* Pipeline Step Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px]">
          <span className="px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-medium">
            1. Image Normalization
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-800 font-medium">
            2. Pattern Classification
          </span>
          <span className="px-2.5 py-1 rounded-full bg-slate-900 text-slate-400 border border-slate-800 font-medium">
            3. Wind Estimation
          </span>
        </div>
      </div>
    );
  }

  // 2. Empty State (No Analysis Run Yet)
  if (status === 'idle' || !prediction) {
    return (
      <div className="rounded-2xl glass-panel p-6 sm:p-8">
        <EmptyState
          icon={Activity}
          title="Awaiting Satellite Image Analysis"
          description="Upload an Infrared (IR) satellite image and optionally a Water Vapour (WV) image, then click 'Run Cyclone Analysis' to evaluate cyclone intensity and pattern classification."
        />
      </div>
    );
  }

  // 3. Success Result State
  const categoryInfo = getCategoryInfo(prediction.category);

  const getTrendBadge = (trend: string) => {
    switch (trend) {
      case 'Intensifying':
        return {
          icon: TrendingUp,
          label: 'Intensifying',
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        };
      case 'Weakening':
        return {
          icon: TrendingDown,
          label: 'Weakening',
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        };
      default:
        return {
          icon: Minus,
          label: 'Steady Intensity',
          bg: 'bg-slate-800 text-slate-300 border-slate-700',
        };
    }
  };

  const trendBadge = getTrendBadge(prediction.trend);
  const TrendIcon = trendBadge.icon;

  return (
    <div className="rounded-2xl glass-panel p-6 sm:p-7 space-y-6 relative overflow-hidden">
      {/* Top Banner Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">AI Cyclone Prediction Result</h3>
            <p className="text-xs text-slate-400 font-mono">
              Model ID: {prediction.id}
            </p>
          </div>
        </div>

        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-xs font-medium flex items-center space-x-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Analysis</span>
          </button>
        )}
      </div>

      {prediction.modelNotice && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs font-mono flex items-start space-x-2.5">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300 block mb-0.5">Model Calibration Status Notice</span>
            <span>{prediction.modelNotice}</span>
          </div>
        </div>
      )}

      {/* Main Result Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Category & Wind Speed & Data Source */}
        <div className="space-y-4">
          
          {/* Category Display Card */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Predicted Intensity Category
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${categoryInfo.badgeBg}`}>
                {categoryInfo.shortCode}
              </span>
            </div>

            <div className="flex items-baseline space-x-3">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                {prediction.category}
              </h2>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {categoryInfo.description}
            </p>
          </div>

          {/* Wind Speed & Trend Cards Grid */}
          <div className="grid grid-cols-2 gap-3">
            
            {/* Wind Speed Stat */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Wind Speed</span>
                </span>
                <span className="font-mono text-[10px] text-slate-500">3-min avg</span>
              </div>

              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-extrabold text-white font-mono">{prediction.windSpeedKmh}</span>
                <span className="text-xs text-slate-400 font-medium">km/h</span>
              </div>
              
              <div className="text-[11px] font-mono text-cyan-400">
                ~ {prediction.windSpeedKnots} knots
              </div>
            </div>

            {/* Trend Stat */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 flex flex-col justify-between">
              <span className="text-xs text-slate-400">Intensity Trend</span>

              <div className="flex items-center space-x-2">
                <div className={`px-2.5 py-1 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 ${trendBadge.bg}`}>
                  <TrendIcon className="w-3.5 h-3.5" />
                  <span>{trendBadge.label}</span>
                </div>
              </div>

              <span className="text-[10px] text-slate-500 font-mono">Short-term pressure gradient</span>
            </div>

          </div>

          {/* Data Sources Used Badge */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-300 font-medium">Satellite Data Source:</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded font-mono font-semibold text-xs border ${
              prediction.sourcesUsed === 'IR + WV'
                ? 'bg-indigo-950/80 text-indigo-300 border-indigo-500/30'
                : 'bg-slate-800 text-cyan-300 border-slate-700'
            }`}>
              {prediction.sourcesUsed}
            </span>
          </div>

          {/* Confidence Gauge */}
          <ConfidenceIndicator
            confidence={prediction.confidence}
            featureScores={prediction.featureScores}
            sourcesUsed={prediction.sourcesUsed}
          />

        </div>

        {/* Right Column: Intensity Forecast Graph & Time metadata */}
        <div className="space-y-4">
          <IntensityForecastGraph prediction={prediction} />

          {/* Timestamp & Footnote */}
          <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Inference Time:</span>
            </div>
            <span className="font-mono text-slate-300">
              {new Date(prediction.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
