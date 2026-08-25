import React from 'react';
import {
  AlertTriangle,
  Flame,
  ShieldAlert,
  X,
  Navigation,
  Building2,
  Trees,
  Waves,
  Zap,
} from 'lucide-react';
import type { PredictionResult } from '../types/prediction';

interface DestructionAlertModalProps {
  isOpen: boolean;
  prediction: PredictionResult | null;
  onClose: () => void;
  onViewTrack?: () => void;
}

export const DestructionAlertModal: React.FC<DestructionAlertModalProps> = ({
  isOpen,
  prediction,
  onClose,
  onViewTrack,
}) => {
  if (!isOpen || !prediction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      {/* Dark overlay backdrop with blur */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Sleek Compact Notification Pop-up Container */}
      <div className="relative w-full max-w-lg bg-[#0a0e1a] border-2 border-red-500/80 rounded-2xl shadow-2xl shadow-red-950/80 overflow-hidden z-10 text-slate-100 my-4">
        
        {/* Compact Warning Header Bar */}
        <div className="p-4 bg-gradient-to-r from-red-950 via-red-900 to-amber-950 border-b border-red-500/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-red-600 text-white border border-red-400 animate-pulse shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wider bg-red-600 text-white shadow-sm">
                  CRITICAL ALERT
                </span>
                <span className="text-[11px] text-red-200 font-mono font-bold">≥100 km/h Threshold</span>
              </div>
              <h2 className="text-base font-black text-white tracking-wide mt-0.5">
                High Speed Destruction Hazard
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900/80 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Compact Modal Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto font-sans">
          
          {/* Main Stat Highlight Box */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-red-950/80 via-red-900/60 to-amber-950/80 border border-red-500/50 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[11px] font-mono font-bold text-red-300 uppercase tracking-wider block">
                Maximum Sustained Wind Speed
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-3xl font-black text-red-400 font-mono">
                  {prediction.windSpeedKmh}
                </span>
                <span className="text-sm font-bold text-white">km/h</span>
                <span className="text-xs text-red-200 font-mono">({prediction.windSpeedKnots} kts)</span>
              </div>
              <p className="text-[11px] text-slate-300">
                IMD Category: <strong className="text-white uppercase">{prediction.category}</strong>
              </p>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-red-600 border border-red-400 text-white text-center shrink-0 shadow-md">
              <span className="text-[9px] font-mono font-black uppercase block text-red-100">Hazard Rating</span>
              <span className="text-xs font-black tracking-wide">SEVERE RISK</span>
            </div>
          </div>

          {/* Compact Destruction Breakdown Grid */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold text-red-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
              <span>Potential Damage & Destruction (100+ km/h Winds)</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start space-x-2">
                <Building2 className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] font-bold text-white">Structural Damage</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Unreinforced roofs & tin sheets destroyed.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start space-x-2">
                <Trees className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] font-bold text-white font-sans">Tree & Grid Outage</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Trees uprooted; power lines snapped.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start space-x-2">
                <Waves className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] font-bold text-white font-sans">Coastal Surges</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Sea waves inundate coastal lowlands.</p>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-start space-x-2">
                <Zap className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-[11px] font-bold text-white font-sans">Flying Debris</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">High-speed airborne missile threats.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Compact Response Protocol */}
          <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-500/30 space-y-1">
            <h4 className="text-[11px] font-bold text-amber-300 font-mono uppercase tracking-wider flex items-center space-x-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Recommended Emergency Steps:</span>
            </h4>
            <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside font-medium">
              <li>Evacuate low-lying coastal zones to designated shelters.</li>
              <li>Secure loose objects, disconnect mains, keep water & food ready.</li>
            </ul>
          </div>

        </div>

        {/* Compact Footer Actions */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-end space-x-2 font-mono text-xs">
          {onViewTrack && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onViewTrack();
              }}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer shadow-md"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>View Track Forecast</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close Alert
          </button>
        </div>

      </div>
    </div>
  );
};
