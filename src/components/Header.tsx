import React, { useEffect, useState } from 'react';
import { CloudLightning, Radio } from 'lucide-react';
import type { SatelliteChannel } from '../types/prediction';
import { THEMES } from '../theme/themeSystem';
import { apiService } from '../services/api';

interface HeaderProps {
  activeChannel?: SatelliteChannel;
}

export const Header: React.FC<HeaderProps> = ({ activeChannel = 'IR' }) => {
  const theme = THEMES[activeChannel] || THEMES.IR;
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const checkBackend = async () => {
      const online = await apiService.checkHealth();
      if (isMounted) setIsBackendOnline(online);
    };
    checkBackend();
    const interval = setInterval(checkBackend, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className={`w-full border-b transition-colors duration-700 backdrop-blur-md sticky top-0 z-50 ${theme.headerBg} ${theme.headerBorder}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Product Branding */}
        <div className="flex items-center space-x-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-700 shrink-0"
            style={{
              backgroundColor: `${theme.accentColor}18`,
              borderColor: `${theme.accentColor}40`,
              color: theme.accentColor,
              borderWidth: 1,
            }}
          >
            <CloudLightning className="w-4 h-4" />
          </div>

          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-wider text-white font-sans uppercase">
              VAYUNETRA <span className="font-semibold transition-colors duration-700" style={{ color: theme.accentColor }}>SYSTEM</span>
            </h1>
          </div>
        </div>

        {/* Middle: Core Navigation Links */}
        <nav className="hidden md:flex items-center space-x-8 text-xs font-medium text-slate-300">
          <button
            type="button"
            onClick={() => scrollToSection('hero-section')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('analysis-section')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Analysis
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('prediction-section')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Predictions
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('track-section')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Track Forecast
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('category-scale')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Category Scale
          </button>
          <button
            type="button"
            onClick={() => scrollToSection('history-section')}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Archive
          </button>
        </nav>

        {/* Right: Mode Status Indicator */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full border transition-colors duration-700 text-slate-300 ${theme.statusPillBg} ${theme.statusPillBorder}`}>
            <Radio className="w-3.5 h-3.5" style={{ color: isBackendOnline ? '#10b981' : theme.accentColor }} />
            <span className="font-medium text-[11px]">
              {isBackendOnline ? 'Backend Online' : 'Local Mode'} • {theme.shortCode}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};
