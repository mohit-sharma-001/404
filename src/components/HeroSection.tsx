import React from 'react';
import { ArrowDown, Activity } from 'lucide-react';
import type { SatelliteChannel } from '../types/prediction';
import { THEMES } from '../theme/themeSystem';

interface HeroSectionProps {
  activeChannel?: SatelliteChannel;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ activeChannel = 'IR' }) => {
  const theme = THEMES[activeChannel] || THEMES.IR;

  const handleScrollToAnalysis = () => {
    const element = document.getElementById('analysis-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      id="hero-section"
      className={`relative w-full py-16 sm:py-24 border-b transition-colors duration-700 ${theme.heroBg} ${theme.heroBorder}`}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        
        {/* Eyebrow Badge */}
        <div
          className={`text-xs font-mono font-bold uppercase tracking-widest mb-3 px-3 py-1 rounded-full border transition-colors duration-700 ${theme.badgeStyle}`}
        >
          {theme.name.toUpperCase()} ({theme.shortCode}) • VAYUNETRA TROPICAL CYCLONE SYSTEM
        </div>

        {/* Headline */}
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-4xl mb-6 font-sans">
          AI-Powered Tropical Cyclone Detection, Classification & Prediction
        </h1>

        {/* Description */}
        <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed mb-8 font-normal">
          Analyzing multi-spectral INSAT-3D Infrared, Visible, Water Vapour, and Passive Microwave satellite imagery to evaluate eyewall brightness gradients and forecast sustained wind speed intensity.
        </p>

        {/* Primary CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button
            type="button"
            onClick={handleScrollToAnalysis}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs font-mono uppercase tracking-wider transition-all duration-300 shadow-xl flex items-center justify-center space-x-2 cursor-pointer font-sans select-none active:scale-95 ${theme.primaryBtn}`}
          >
            <Activity className="w-4 h-4 fill-current text-current" />
            <span>Explore Live {theme.shortCode} Ingestion</span>
          </button>
        </div>

        {/* Scroll Indicator */}
        <button
          type="button"
          onClick={handleScrollToAnalysis}
          className="flex flex-col items-center space-y-1.5 text-slate-400 hover:text-white transition-colors group cursor-pointer"
        >
          <span className="text-xs uppercase tracking-wider text-slate-400 group-hover:text-white font-medium font-mono">
            Scroll to Satellite Ingestion
          </span>
          <ArrowDown className="w-4 h-4 text-slate-400 group-hover:text-white animate-bounce" style={{ color: theme.accentColor }} />
        </button>

      </div>
    </section>
  );
};

