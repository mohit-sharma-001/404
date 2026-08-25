import React, { useState, useEffect } from 'react';
import { Navigation, ShieldCheck, Layers, RefreshCw } from 'lucide-react';
import type { PredictionResult, SatelliteChannel, TrackPredictionResponseResult } from '../types/prediction';
import { THEMES } from '../theme/themeSystem';
import { apiService } from '../services/api';

interface TrackPredictionSectionProps {
  activeChannel?: SatelliteChannel;
  prediction?: PredictionResult | null;
}

export const TrackPredictionSection: React.FC<TrackPredictionSectionProps> = ({
  activeChannel = 'IR',
  prediction,
}) => {
  const theme = THEMES[activeChannel] || THEMES.IR;

  const [loading, setLoading] = useState<boolean>(false);
  const [trackResult, setTrackResult] = useState<TrackPredictionResponseResult | null>(null);

  // Automatically fetch / calculate track prediction whenever prediction changes or on mount
  useEffect(() => {
    const lat = prediction?.centerLat || 15.0;
    const lon = prediction?.centerLon || 86.5;
    const spd = prediction?.windSpeedKnots ? Math.round(prediction.windSpeedKnots * 0.25) : 12.0;
    
    fetchTrackPrediction(lat, lon, spd, 350.0, 350.0);
  }, [prediction]);

  const fetchTrackPrediction = async (
    lat: number,
    lon: number,
    spd: number,
    heading: number,
    dist: number
  ) => {
    setLoading(true);
    try {
      const res = await apiService.predictTrack({
        current_lat: lat,
        current_lon: lon,
        storm_speed_kts: spd,
        storm_dir_deg: heading,
        dist2land_km: dist,
        month: new Date().getMonth() + 1,
      });
      setTrackResult(res);
    } catch (err) {
      console.error('Track prediction failed', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper mapping coordinates to North Indian Ocean spatial plane (Lat: 5° - 25°N, Lon: 60° - 100°E)
  const mapToCanvasCoords = (lat: number, lon: number) => {
    const minLat = 5, maxLat = 25;
    const minLon = 60, maxLon = 100;
    const x = ((lon - minLon) / (maxLon - minLon)) * 600;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 320;
    return { x: Math.max(20, Math.min(580, x)), y: Math.max(20, Math.min(300, y)) };
  };

  const currLat = trackResult?.current_location.latitude || prediction?.centerLat || 15.0;
  const currLon = trackResult?.current_location.longitude || prediction?.centerLon || 86.5;

  const currCoords = mapToCanvasCoords(currLat, currLon);

  const pos24 = trackResult
    ? mapToCanvasCoords(
        trackResult.forecast_24h.latitude || trackResult.forecast_24h.lat || currLat + 2,
        trackResult.forecast_24h.longitude || trackResult.forecast_24h.lon || currLon - 1
      )
    : null;

  const pos48 = trackResult
    ? mapToCanvasCoords(
        trackResult.forecast_48h.latitude || trackResult.forecast_48h.lat || currLat + 4,
        trackResult.forecast_48h.longitude || trackResult.forecast_48h.lon || currLon - 2
      )
    : null;

  return (
    <section id="track-section" className="space-y-6 pt-4">
      {/* Header */}
      <div className={`border-b pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors duration-700 ${theme.sectionDivider}`}>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Navigation className="w-5 h-5" style={{ color: theme.accentColor }} />
            <span>24h & 48h Cyclone Trajectory Forecast Path</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Machine learning spatial displacement model trained on North Indian Ocean cyclone trajectories
          </p>
        </div>
        <div className={`px-2.5 py-1 rounded-md border text-[11px] font-mono text-slate-300 transition-colors duration-700 ${theme.statusPillBg} ${theme.statusPillBorder}`}>
          Model: <span className="font-bold" style={{ color: theme.accentColor }}>IBTrACS Track Regressor</span>
        </div>
      </div>

      {loading && !trackResult ? (
        <div className="p-12 rounded-2xl bg-[#02050A]/95 border border-slate-800 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
          <span className="text-xs font-mono text-slate-400">Computing +24h & +48h Trajectory Path...</span>
        </div>
      ) : trackResult ? (
        <div className="p-6 rounded-2xl bg-[#02050A]/95 border border-slate-700 space-y-6 shadow-2xl animate-fade-in">
          
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white font-sans flex items-center space-x-2">
                <Navigation className="w-5 h-5 text-cyan-400" />
                <span>Predicted Trajectory Path & Heading</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Movement Direction: <span className="text-white font-bold">{trackResult.movement_direction} ({trackResult.heading_degrees}°)</span> | Estimated Speed: <span className="text-white font-bold">{trackResult.estimated_speed_kmh} km/h</span>
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
              <span>24h Median Accuracy: {trackResult.model_metrics?.median_err_24h_km || 98.89} km</span>
            </div>
          </div>

          {/* Interactive Trajectory SVG Canvas Map Plane */}
          <div className="relative w-full bg-[#030914] border border-slate-800 rounded-xl p-4 overflow-hidden">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2 border-b border-slate-800/60 pb-2">
              <span className="flex items-center space-x-1 text-cyan-400 font-bold">
                <Layers className="w-3.5 h-3.5" />
                <span>Spatial Map Plane (North Indian Ocean Basin)</span>
              </span>
              <span>Coordinates Grid: 5°N - 25°N | 60°E - 100°E</span>
            </div>

            <div className="relative w-full h-[320px] bg-[#02060f] rounded-lg border border-slate-800/80 overflow-hidden">
              {/* Map grid lines */}
              <svg className="w-full h-full" viewBox="0 0 600 320">
                {/* Background Grid Lines */}
                <line x1="0" y1="80" x2="600" y2="80" stroke="#1e293b" strokeDasharray="3,3" />
                <line x1="0" y1="160" x2="600" y2="160" stroke="#1e293b" strokeDasharray="3,3" />
                <line x1="0" y1="240" x2="600" y2="240" stroke="#1e293b" strokeDasharray="3,3" />

                <line x1="150" y1="0" x2="150" y2="320" stroke="#1e293b" strokeDasharray="3,3" />
                <line x1="300" y1="0" x2="300" y2="320" stroke="#1e293b" strokeDasharray="3,3" />
                <line x1="450" y1="0" x2="450" y2="320" stroke="#1e293b" strokeDasharray="3,3" />

                {/* Grid Labels */}
                <text x="10" y="75" fill="#475569" fontSize="10" fontFamily="monospace">20°N</text>
                <text x="10" y="155" fill="#475569" fontSize="10" fontFamily="monospace">15°N</text>
                <text x="10" y="235" fill="#475569" fontSize="10" fontFamily="monospace">10°N</text>

                <text x="140" y="310" fill="#475569" fontSize="10" fontFamily="monospace">70°E</text>
                <text x="290" y="310" fill="#475569" fontSize="10" fontFamily="monospace">80°E</text>
                <text x="440" y="310" fill="#475569" fontSize="10" fontFamily="monospace">90°E</text>

                {/* Simulated Coastline schematic */}
                <path
                  d="M 120 40 Q 180 90 220 180 T 260 280"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />
                <text x="180" y="120" fill="#334155" fontSize="10" fontFamily="monospace" transform="rotate(-30 180 120)">India Coastline</text>

                {pos24 && pos48 && (
                  <>
                    {/* Trajectory Vector Path */}
                    <path
                      d={`M ${currCoords.x} ${currCoords.y} L ${pos24.x} ${pos24.y} L ${pos48.x} ${pos48.y}`}
                      fill="none"
                      stroke="#06b6d4"
                      strokeWidth="3"
                      strokeDasharray="6,4"
                    />

                    {/* 24h & 48h Error Cones / Uncertainty Radiuses */}
                    <circle cx={pos24.x} cy={pos24.y} r="26" fill="#06b6d4" opacity="0.15" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2,2" />
                    <circle cx={pos48.x} cy={pos48.y} r="45" fill="#818cf8" opacity="0.15" stroke="#818cf8" strokeWidth="1" strokeDasharray="2,2" />

                    {/* Current Position Marker */}
                    <circle cx={currCoords.x} cy={currCoords.y} r="10" fill="#ef4444" opacity="0.4" className="animate-ping" />
                    <circle cx={currCoords.x} cy={currCoords.y} r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                    <text x={currCoords.x + 12} y={currCoords.y + 4} fill="#f87171" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
                      Current ({currLat.toFixed(1)}°N, {currLon.toFixed(1)}°E)
                    </text>

                    {/* +24h Forecast Marker */}
                    <circle cx={pos24.x} cy={pos24.y} r="5" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
                    <text x={pos24.x + 10} y={pos24.y + 4} fill="#38bdf8" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                      +24h Forecast Position
                    </text>

                    {/* +48h Forecast Marker */}
                    <circle cx={pos48.x} cy={pos48.y} r="5" fill="#818cf8" stroke="#ffffff" strokeWidth="1.5" />
                    <text x={pos48.x + 10} y={pos48.y + 4} fill="#a5b4fc" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
                      +48h Forecast Position
                    </text>
                  </>
                )}
              </svg>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 24-Hour Forecast */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-cyan-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-cyan-400 border-b border-cyan-900/50 pb-2">
                <span className="font-bold tracking-wider uppercase">🚀 +24 Hour Forecast Position</span>
                <span className="bg-cyan-950 px-2 py-0.5 rounded text-[11px]">24h Horizon</span>
              </div>
              <div className="space-y-1 font-mono text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Forecast Latitude:</span>
                  <span className="font-bold text-white">{(trackResult.forecast_24h.latitude || trackResult.forecast_24h.lat)?.toFixed(2)}°N</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Forecast Longitude:</span>
                  <span className="font-bold text-white">{(trackResult.forecast_24h.longitude || trackResult.forecast_24h.lon)?.toFixed(2)}°E</span>
                </div>
                <div className="flex justify-between text-slate-400 text-xs pt-1 border-t border-slate-800">
                  <span>Forecast Displacement:</span>
                  <span className="text-cyan-300 font-bold">{trackResult.forecast_24h.distance_km} km</span>
                </div>
              </div>
            </div>

            {/* 48-Hour Forecast */}
            <div className="p-5 rounded-xl bg-slate-900/80 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-indigo-400 border-b border-indigo-900/50 pb-2">
                <span className="font-bold tracking-wider uppercase">🛰️ +48 Hour Forecast Position</span>
                <span className="bg-indigo-950 px-2 py-0.5 rounded text-[11px]">48h Horizon</span>
              </div>
              <div className="space-y-1 font-mono text-sm">
                <div className="flex justify-between text-slate-300">
                  <span>Forecast Latitude:</span>
                  <span className="font-bold text-white">{(trackResult.forecast_48h.latitude || trackResult.forecast_48h.lat)?.toFixed(2)}°N</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Forecast Longitude:</span>
                  <span className="font-bold text-white">{(trackResult.forecast_48h.longitude || trackResult.forecast_48h.lon)?.toFixed(2)}°E</span>
                </div>
                <div className="flex justify-between text-slate-400 text-xs pt-1 border-t border-slate-800">
                  <span>Forecast Displacement:</span>
                  <span className="text-indigo-300 font-bold">{trackResult.forecast_48h.distance_km} km</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      ) : null}
    </section>
  );
};
