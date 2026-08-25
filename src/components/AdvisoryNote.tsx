import React from 'react';
import { Landmark, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import type { SatelliteChannel } from '../types/prediction';
import { THEMES } from '../theme/themeSystem';

interface AdvisoryNoteProps {
  activeChannel?: SatelliteChannel;
}

export const AdvisoryNote: React.FC<AdvisoryNoteProps> = ({ activeChannel = 'IR' }) => {
  const theme = THEMES[activeChannel] || THEMES.IR;

  return (
    <footer className={`w-full mt-16 border-t transition-colors duration-700 py-12 px-4 sm:px-6 lg:px-8 relative z-20 ${theme.headerBg} ${theme.headerBorder}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Prominent Official Government Data Source Panel */}
        <div className="p-6 sm:p-8 rounded-2xl bg-[#02050A]/95 border border-slate-700/90 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all duration-700 hover:border-slate-500 space-y-6 relative overflow-hidden group">
          
          {/* Subtle Ambient Glow Pill */}
          <div
            className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-10 pointer-events-none blur-3xl transition-colors duration-700"
            style={{ backgroundColor: theme.accentColor }}
          />

          {/* Top Row: Official Source Badge & Entity Tag */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/90 pb-4">
            <div className="flex items-center space-x-2.5">
              <div
                className="p-2 rounded-lg transition-colors duration-700 shrink-0"
                style={{
                  backgroundColor: `${theme.accentColor}18`,
                  borderColor: `${theme.accentColor}40`,
                  color: theme.accentColor,
                  borderWidth: 1,
                }}
              >
                <Landmark className="w-4 h-4" />
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider border uppercase ${theme.badgeStyle}`}>
                OFFICIAL GOVERNMENT DATA SOURCE
              </span>
            </div>

            <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-400">
              <ShieldCheck className="w-4 h-4" style={{ color: theme.accentColor }} />
              <span>Verified Government Portal</span>
            </div>
          </div>

          {/* Core Institutional Content & Action CTA Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Left: Department & Explanation Hierarchy */}
            <div className="space-y-3 max-w-3xl">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
                  India Meteorological Department (IMD)
                </h3>
                <p className="text-xs font-mono font-medium text-slate-400 mt-0.5">
                  Ministry of Earth Sciences, Government of India
                </p>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                <strong className="text-white">VAYUNETRA</strong> operates as an AI/ML decision-support tool for satellite pattern identification and wind intensity estimation. Tropical cyclone bulletins, official warnings, and public evacuation orders for the North Indian Ocean are issued exclusively by the <strong className="text-slate-100">India Meteorological Department (IMD)</strong>.
              </p>
            </div>

            {/* Right: High-Contrast Primary CTA Button */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-center gap-2 shrink-0">
              <a
                href="https://mausam.imd.gov.in"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open official India Meteorological Department portal (opens in new tab)"
                className={`w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-xs font-mono uppercase tracking-wider transition-all duration-300 shadow-xl flex items-center justify-center space-x-2.5 cursor-pointer select-none hover:-translate-y-0.5 active:translate-y-0 ${theme.primaryBtn}`}
              >
                <span>Open Official IMD Portal</span>
                <ExternalLink className="w-4 h-4 shrink-0" />
              </a>

              <span className="text-[10px] font-mono text-slate-400 tracking-wider">
                Destination: <span className="text-slate-200 underline">mausam.imd.gov.in</span>
              </span>
            </div>

          </div>

          {/* Bottom Footnote Disclaimer */}
          <div className="pt-4 border-t border-slate-800/80 flex items-center space-x-2 text-[11px] font-mono text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span>Always cross-reference model prediction telemetry with official IMD meteorological bulletins.</span>
          </div>

        </div>

        {/* Footer System Meta */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 border-t border-slate-900 pt-6 gap-2 font-mono text-[11px]">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4" style={{ color: theme.accentColor }} />
            <span>VAYUNETRA • Multi-Spectral AI Satellite Processing Platform</span>
          </div>
          <div className="text-slate-400">
            INSAT-3D TIR-1, VIS, WV & PMW Satellite Analytics
          </div>
        </div>

      </div>
    </footer>
  );
};
