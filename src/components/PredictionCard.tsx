import React from 'react';
import { Wind, Layers, Clock, Cpu, Sparkles, RefreshCw, Activity, ShieldAlert, Navigation, MapPin, AlertTriangle } from 'lucide-react';
import type { AnalysisStatus, PredictionResult } from '../types/prediction';
import { getCategoryInfo } from '../data/cycloneCategories';
import { ConfidenceIndicator } from './ConfidenceIndicator';
import { EmptyState } from './EmptyState';
import { detectImageSpectrum } from './AdaptiveUploadCard';

interface PredictionCardProps {
  status: AnalysisStatus;
  prediction: PredictionResult | null;
  onReset?: () => void;
  onOpenDestructionAlert?: () => void;
  onViewTrack?: () => void;
}

export const PredictionCard: React.FC<PredictionCardProps> = ({
  status,
  prediction,
  onReset,
  onOpenDestructionAlert,
  onViewTrack,
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
            3. Wind Estimation & Track Sync
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
          description="Upload an Infrared (IR) satellite image and optionally a Water Vapour (WV) image, then click 'Run Cyclone Analysis' to evaluate cyclone classification, high-wind destruction risk, and trajectory prediction."
        />
      </div>
    );
  }

  // 3. Success Result State
  const hasCyclone = prediction.hasCyclone !== false;

  if (!hasCyclone) {
    return (
      <div className="rounded-2xl glass-panel p-6 sm:p-7 space-y-6 relative overflow-hidden">
        {/* Top Banner Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Cyclone Analysis Result</h3>
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

        {/* Prominent "No Cyclone Detected" Display Card */}
        <div className="p-6 rounded-2xl bg-amber-950/40 border-2 border-amber-500/50 space-y-4 text-center sm:text-left flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-5 shadow-xl">
          <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div className="space-y-1.5 flex-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30">
              No Cyclone Detected
            </span>
            <h3 className="text-xl font-extrabold text-white">
              No Active Cyclone Structure Detected
            </h3>
            <p className="text-sm text-amber-200 font-mono leading-relaxed">
              {prediction.warningMessage || prediction.modelNotice || "No cyclone detected in this image. This does not appear to be cyclone satellite imagery."}
            </p>
          </div>
        </div>

        {/* Data Source & Timestamp details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Satellite Data Source:</span>
            <span className="text-cyan-300 font-bold">{prediction.sourcesUsed}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-400">Analysis Time:</span>
            <span className="text-slate-200">{new Date(prediction.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} IST</span>
          </div>
        </div>
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(prediction.category);
  const isHighWind = prediction.windSpeedKmh >= 100;

  const uploadedName = prediction.uploadedImageName || prediction.irImageName || '';
  const detectedSpectrum = detectImageSpectrum(uploadedName);
  const isSpectrumMismatch = Boolean(
    detectedSpectrum &&
      prediction.channelUsed &&
      detectedSpectrum !== prediction.channelUsed
  );

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

        <div className="flex items-center space-x-2">
          {isHighWind && onOpenDestructionAlert && (
            <button
              type="button"
              onClick={onOpenDestructionAlert}
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white border-2 border-red-400 font-mono text-xs font-black uppercase tracking-wider flex items-center space-x-2 cursor-pointer shadow-lg shadow-red-950 animate-bounce"
            >
              <ShieldAlert className="w-4 h-4 text-white" />
              <span>🚨 DESTRUCTION ALERT (≥100 KM/H)</span>
            </button>
          )}

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
      </div>

      {/* Ultra Prominent High Wind Destruction Alert Banner */}
      {isHighWind && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-red-950 via-red-900 to-amber-950 border-2 border-red-500 text-white shadow-2xl shadow-red-950/90 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 rounded-xl bg-red-600 text-white border border-red-400 shrink-0">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded bg-red-500 text-white font-mono text-[10px] font-black uppercase tracking-wider">
                  HIGH SPEED EMERGENCY
                </span>
                <span className="text-xs text-red-200 font-mono font-bold">
                  Sustained Wind Speed: {prediction.windSpeedKmh} km/h (≥100 km/h)
                </span>
              </div>
              <h4 className="text-base font-extrabold text-white tracking-wide mt-1">
                ⚠️ SEVERE DESTRUCTION HAZARD WARNING
              </h4>
              <p className="text-xs text-red-100 mt-1 leading-relaxed">
                Extremely high wind speeds of {prediction.windSpeedKmh} km/h detected! High probability of severe structural damage, tree uprooting, power grid failure, and coastal surges.
              </p>
            </div>
          </div>

          {onOpenDestructionAlert && (
            <button
              type="button"
              onClick={onOpenDestructionAlert}
              className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-black uppercase tracking-wider shrink-0 cursor-pointer shadow-xl border-2 border-red-300 transition-transform active:scale-95 text-center"
            >
              🚨 VIEW FULL DESTRUCTION WARNING
            </button>
          )}
        </div>
      )}

      {/* Spectral Spectrum Mismatch Warning Notice */}
      {isSpectrumMismatch && (
        <div className="p-4 rounded-xl bg-amber-950/80 border-2 border-amber-500/80 text-amber-200 text-xs font-mono flex items-start space-x-3 shadow-xl">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300 block text-sm uppercase tracking-wider mb-0.5">
              ⚠️ Satellite Channel Spectrum Mismatch Notice
            </span>
            <p className="text-slate-200">
              The uploaded image filename <strong className="text-white">[{uploadedName}]</strong> detected as spectrum <strong className="text-amber-300">[{detectedSpectrum}]</strong> does not match active mode <strong className="text-white">[{prediction.channelUsed}]</strong>.
            </p>
            <p className="text-amber-300/80 text-[11px] mt-1">
              For maximum classification precision, ensure the uploaded satellite image fits the selected instrument mode.
            </p>
          </div>
        </div>
      )}

      {(prediction.warningMessage || prediction.modelNotice) && (
        <div className="p-4 rounded-xl bg-amber-950/90 border-2 border-amber-500/80 text-amber-200 text-xs font-mono flex items-start space-x-3 shadow-xl">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300 block text-sm uppercase tracking-wider mb-0.5">
              ⚠️ Satellite Validation & Calibration Notice
            </span>
            <p className="text-slate-100">{prediction.warningMessage || prediction.modelNotice}</p>
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

          {/* Ultra Visible Wind Speed Stat Card (Full Width) */}
          <div className={`p-5 rounded-2xl border transition-all space-y-2 ${
            isHighWind
              ? 'border-2 border-red-500 bg-gradient-to-r from-red-950/90 via-red-900/70 to-amber-950/90 shadow-2xl shadow-red-950'
              : 'border-slate-800 bg-slate-900/80'
          }`}>
            <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
              <span className="flex items-center space-x-1.5">
                <Wind className={`w-4 h-4 ${isHighWind ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`} />
                <span className="font-bold uppercase tracking-wider">Estimated Sustained Wind Speed</span>
              </span>
              <span className="text-[10px] text-slate-400">3-min avg</span>
            </div>

            <div className="flex items-baseline space-x-2">
              <span className={`text-4xl sm:text-5xl font-black font-mono tracking-tight ${
                isHighWind ? 'text-red-400 drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]' : 'text-white'
              }`}>
                {prediction.windSpeedKmh}
              </span>
              <span className="text-lg font-bold text-slate-200">km/h</span>
              <span className={`text-sm font-mono pl-3 font-bold ${isHighWind ? 'text-red-300' : 'text-cyan-400'}`}>
                (~ {prediction.windSpeedKnots} knots)
              </span>
            </div>

            {/* If Wind Speed >= 100 km/h, show bold alert badge & button inside wind card */}
            {isHighWind && (
              <div className="pt-2 border-t border-red-500/40 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-red-200">
                  <span className="flex items-center space-x-1">
                    <ShieldAlert className="w-4 h-4 text-red-400" />
                    <span>CRITICAL HIGH SPEED THRESHOLD</span>
                  </span>
                  <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-black uppercase">
                    ≥100 KM/H
                  </span>
                </div>
                {onOpenDestructionAlert && (
                  <button
                    type="button"
                    onClick={onOpenDestructionAlert}
                    className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-black uppercase tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-lg border border-red-400"
                  >
                    <ShieldAlert className="w-4 h-4 text-white" />
                    <span>OPEN DESTRUCTION HAZARD WARNING</span>
                  </button>
                )}
              </div>
            )}
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

        {/* Right Column: Integrated Cyclone Track Forecast Quick View Card & Timestamp */}
        <div className="space-y-4">

          {/* Integrated Cyclone Track Forecast Quick View Card */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400 border-b border-slate-800 pb-3">
              <span className="font-bold flex items-center space-x-1.5 uppercase">
                <Navigation className="w-4 h-4 text-cyan-400" />
                <span>Frontend Track Prediction Status</span>
              </span>
              <span className="bg-cyan-950 px-2 py-0.5 rounded text-[11px] text-cyan-300 border border-cyan-500/30">
                IBTrACS ML Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px]">Storm Center Location</span>
                <span className="text-white font-bold flex items-center space-x-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>{(prediction.centerLat || 15.0).toFixed(1)}°N, {(prediction.centerLon || 86.5).toFixed(1)}°E</span>
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-slate-400 block text-[10px]">Trajectory Horizon</span>
                <span className="text-cyan-300 font-bold block">+24h & +48h Vector Path</span>
              </div>
            </div>

            {onViewTrack && (
              <button
                type="button"
                onClick={onViewTrack}
                className="w-full py-3 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                <Navigation className="w-4 h-4" />
                <span>View Predicted Path on Map Plane</span>
              </button>
            )}
          </div>

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
