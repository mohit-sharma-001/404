import React, { useState } from 'react';
import { Navigation, Compass, MapPin, Gauge, ShieldCheck, RefreshCw, Send } from 'lucide-react';
import type { SatelliteChannel, TrackPredictionResponseResult } from '../types/prediction';
import { THEMES } from '../theme/themeSystem';
import { apiService } from '../services/api';

interface TrackPredictionSectionProps {
  activeChannel?: SatelliteChannel;
}

const TRACK_PRESET_STORMS = [
  {
    name: 'Cyclone Amphan (2020)',
    lat: 15.0,
    lon: 86.5,
    speed: 12.0,
    heading: 350.0,
    dist2land: 450.0,
  },
  {
    name: 'Cyclone Tauktae (2021)',
    lat: 16.2,
    lon: 72.8,
    speed: 13.0,
    heading: 340.0,
    dist2land: 180.0,
  },
  {
    name: 'Cyclone Biparjoy (2023)',
    lat: 17.5,
    lon: 67.3,
    speed: 9.0,
    heading: 10.0,
    dist2land: 320.0,
  },
  {
    name: 'Cyclone Remal (2024)',
    lat: 19.5,
    lon: 89.2,
    speed: 11.0,
    heading: 5.0,
    dist2land: 120.0,
  },
];

export const TrackPredictionSection: React.FC<TrackPredictionSectionProps> = ({ activeChannel = 'IR' }) => {
  const theme = THEMES[activeChannel] || THEMES.IR;

  const [currentLat, setCurrentLat] = useState<number>(15.0);
  const [currentLon, setCurrentLon] = useState<number>(86.5);
  const [speedKts, setSpeedKts] = useState<number>(12.0);
  const [headingDeg, setHeadingDeg] = useState<number>(350.0);
  const [dist2land, setDist2land] = useState<number>(350.0);

  const [loading, setLoading] = useState<boolean>(false);
  const [trackResult, setTrackResult] = useState<TrackPredictionResponseResult | null>(null);

  const handlePredictTrack = async () => {
    setLoading(true);
    try {
      const res = await apiService.predictTrack({
        current_lat: currentLat,
        current_lon: currentLon,
        storm_speed_kts: speedKts,
        storm_dir_deg: headingDeg,
        dist2land_km: dist2land,
        month: new Date().getMonth() + 1,
      });
      setTrackResult(res);
    } catch (err) {
      console.error('Track prediction failed', err);
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (preset: typeof TRACK_PRESET_STORMS[0]) => {
    setCurrentLat(preset.lat);
    setCurrentLon(preset.lon);
    setSpeedKts(preset.speed);
    setHeadingDeg(preset.heading);
    setDist2land(preset.dist2land);
    setTrackResult(null);
  };

  return (
    <section id="track-section" className="space-y-6 pt-4">
      <div className={`border-b pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors duration-700 ${theme.sectionDivider}`}>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Navigation className="w-5 h-5" style={{ color: theme.accentColor }} />
            <span>24h & 48h Cyclone Trajectory Forecasting (IBTrACS ML)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Machine learning gradient boosted spatial displacement regressor trained on North Indian Ocean cyclone tracks
          </p>
        </div>
        <div className={`px-2.5 py-1 rounded-md border text-[11px] font-mono text-slate-300 transition-colors duration-700 ${theme.statusPillBg} ${theme.statusPillBorder}`}>
          Model: <span className="font-bold" style={{ color: theme.accentColor }}>MultiOutput Track Regressor</span>
        </div>
      </div>

      {/* Preset Selector Buttons */}
      <div className="p-4 rounded-xl bg-[#02050A]/90 border border-slate-800 space-y-2 backdrop-blur-xl">
        <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider block">
          Select Historical Storm Telemetry Preset:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {TRACK_PRESET_STORMS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => applyPreset(preset)}
              className="px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900/60 hover:bg-slate-800 hover:border-slate-500 text-xs font-mono text-slate-200 transition-all cursor-pointer"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Input Parameters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Latitude */}
        <div className="p-4 rounded-xl bg-[#040812]/90 border border-slate-800 space-y-1.5">
          <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>Current Lat (°N)</span>
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
          </label>
          <input
            type="number"
            step="0.1"
            value={currentLat}
            onChange={(e) => setCurrentLat(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Longitude */}
        <div className="p-4 rounded-xl bg-[#040812]/90 border border-slate-800 space-y-1.5">
          <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>Current Lon (°E)</span>
            <MapPin className="w-3.5 h-3.5 text-slate-500" />
          </label>
          <input
            type="number"
            step="0.1"
            value={currentLon}
            onChange={(e) => setCurrentLon(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Speed */}
        <div className="p-4 rounded-xl bg-[#040812]/90 border border-slate-800 space-y-1.5">
          <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>Storm Speed (knots)</span>
            <Gauge className="w-3.5 h-3.5 text-slate-500" />
          </label>
          <input
            type="number"
            step="0.5"
            value={speedKts}
            onChange={(e) => setSpeedKts(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Heading */}
        <div className="p-4 rounded-xl bg-[#040812]/90 border border-slate-800 space-y-1.5">
          <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>Heading Angle (deg)</span>
            <Compass className="w-3.5 h-3.5 text-slate-500" />
          </label>
          <input
            type="number"
            step="5"
            value={headingDeg}
            onChange={(e) => setHeadingDeg(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* Distance to Land */}
        <div className="p-4 rounded-xl bg-[#040812]/90 border border-slate-800 space-y-1.5">
          <label className="text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>Dist to Land (km)</span>
            <Navigation className="w-3.5 h-3.5 text-slate-500" />
          </label>
          <input
            type="number"
            step="10"
            value={dist2land}
            onChange={(e) => setDist2land(parseFloat(e.target.value) || 0)}
            className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handlePredictTrack}
          disabled={loading}
          className={`px-6 py-3 rounded-xl font-bold text-xs font-mono uppercase tracking-wider transition-all duration-300 shadow-xl flex items-center space-x-2 cursor-pointer ${theme.primaryBtn}`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Calculating Trajectory...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Forecast +24h & +48h Trajectory</span>
            </>
          )}
        </button>
      </div>

      {/* Track Forecast Display Cards */}
      {trackResult && (
        <div className="p-6 rounded-2xl bg-[#02050A]/95 border border-slate-700 space-y-6 shadow-2xl animate-fade-in">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white font-sans flex items-center space-x-2">
                <Navigation className="w-5 h-5 text-cyan-400" />
                <span>Forecasted Trajectory Telemetry</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Heading: <span className="text-white font-bold">{trackResult.movement_direction} ({trackResult.heading_degrees}°)</span> | Estimated Speed: <span className="text-white font-bold">{trackResult.estimated_speed_kmh} km/h</span>
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
              <span>24h Median Error: {trackResult.model_metrics?.median_err_24h_km || 98.89} km</span>
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
                  <span className="font-bold text-white">{trackResult.forecast_24h.latitude || trackResult.forecast_24h.lat}°N</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Forecast Longitude:</span>
                  <span className="font-bold text-white">{trackResult.forecast_24h.longitude || trackResult.forecast_24h.lon}°E</span>
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
                  <span className="font-bold text-white">{trackResult.forecast_48h.latitude || trackResult.forecast_48h.lat}°N</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Forecast Longitude:</span>
                  <span className="font-bold text-white">{trackResult.forecast_48h.longitude || trackResult.forecast_48h.lon}°E</span>
                </div>
                <div className="flex justify-between text-slate-400 text-xs pt-1 border-t border-slate-800">
                  <span>Forecast Displacement:</span>
                  <span className="text-indigo-300 font-bold">{trackResult.forecast_48h.distance_km} km</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
