import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import type { SatelliteChannel } from '../types/prediction';
import { THEMES } from '../theme/themeSystem';

interface ChannelDropdownProps {
  selectedChannel: SatelliteChannel;
  onSelectChannel: (channel: SatelliteChannel) => void;
  disabled?: boolean;
}

export const ChannelDropdown: React.FC<ChannelDropdownProps> = ({
  selectedChannel,
  onSelectChannel,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const channelList: SatelliteChannel[] = ['IR', 'VIS', 'WV', 'PMW'];
  const currentTheme = THEMES[selectedChannel] || THEMES.IR;
  const CurrentIcon = currentTheme.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    document.addEventListener('touchstart', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside, true);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setFocusedIndex(channelList.indexOf(selectedChannel));
      } else if (focusedIndex >= 0 && focusedIndex < channelList.length) {
        onSelectChannel(channelList[focusedIndex]);
        setIsOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setFocusedIndex(0);
      } else {
        setFocusedIndex((prev) => (prev + 1) % channelList.length);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setFocusedIndex(channelList.length - 1);
      } else {
        setFocusedIndex((prev) => (prev - 1 + channelList.length) % channelList.length);
      }
    }
  };

  const handleOptionSelect = (channel: SatelliteChannel, e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelectChannel(channel);
    setIsOpen(false);
  };

  return (
    <div
      className="relative inline-block text-left w-full sm:w-auto font-mono pointer-events-auto"
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      <div className="flex items-center space-x-2 mb-1.5">
        <label className="text-[11px] font-mono font-bold tracking-wider text-slate-300 uppercase flex items-center space-x-1.5 select-none">
          <span>Imagery Type</span>
          <span className="text-slate-500">•</span>
          <span className="text-[10px] text-slate-400 font-normal">Adaptive Mode</span>
        </label>
      </div>

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setIsOpen(!isOpen);
        }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full sm:min-w-[280px] px-4 py-2.5 rounded-lg border transition-all duration-300 flex items-center justify-between font-mono text-xs cursor-pointer shadow-lg backdrop-blur-md relative z-20 select-none ${
          isOpen
            ? `${currentTheme.cardBg} ${currentTheme.borderColor} text-white ${currentTheme.borderGlow}`
            : `${currentTheme.cardBg} hover:bg-slate-800/80 ${currentTheme.borderColor} text-slate-100 hover:border-slate-500`
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center space-x-3 truncate">
          <div
            className="p-1.5 rounded-md flex items-center justify-center shrink-0 transition-colors"
            style={{
              backgroundColor: `${currentTheme.accentColor}20`,
              borderColor: `${currentTheme.accentColor}40`,
              color: currentTheme.accentColor,
              borderWidth: 1,
            }}
          >
            <CurrentIcon className="w-4 h-4" />
          </div>
          <div className="flex flex-col text-left truncate">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-100">{currentTheme.name} ({currentTheme.shortCode})</span>
            </div>
            <span className="text-[10px] text-slate-400 truncate">{currentTheme.tag}</span>
          </div>
        </div>

        <ChevronDown
          className={`w-4 h-4 ml-2 transition-transform duration-300 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
          style={{ color: currentTheme.accentColor }}
        />
      </button>

      {/* 100% Reliable Interactive Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 sm:right-auto sm:w-[330px] mt-2 z-[100] rounded-xl bg-[#040810]/98 backdrop-blur-2xl border border-slate-700/90 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 pointer-events-auto select-none"
        >
          <div className="p-2.5 border-b border-slate-800/90 bg-[#02050A]/90 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider font-mono">
            <span>Satellite Mode Options</span>
            <span className="font-bold text-slate-200">4 Active Modes</span>
          </div>

          <div className="p-1.5 space-y-1 max-h-[320px] overflow-y-auto">
            {channelList.map((chKey, index) => {
              const theme = THEMES[chKey];
              const Icon = theme.icon;
              const isSelected = chKey === selectedChannel;
              const isFocused = index === focusedIndex;

              return (
                <button
                  key={chKey}
                  ref={(el) => { optionRefs.current[index] = el; }}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => handleOptionSelect(chKey, e)}
                  onClick={(e) => handleOptionSelect(chKey, e)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 flex items-start space-x-3 cursor-pointer relative z-[101] pointer-events-auto ${
                    isSelected
                      ? 'bg-slate-800/90 text-white border border-slate-600 shadow-md'
                      : isFocused
                      ? 'bg-slate-800/60 text-slate-100 border border-slate-700'
                      : 'hover:bg-slate-800/40 text-slate-300 border border-transparent'
                  }`}
                >
                  <div
                    className="p-2 rounded-md shrink-0 transition-transform duration-200"
                    style={{
                      backgroundColor: `${theme.accentColor}20`,
                      color: theme.accentColor,
                      borderColor: `${theme.accentColor}40`,
                      borderWidth: 1,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-white">{theme.name} ({theme.shortCode})</span>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 shrink-0" style={{ color: theme.accentColor }} />
                      )}
                    </div>

                    <p className="text-[10px] text-slate-400 mt-1 leading-snug font-sans line-clamp-2">
                      {theme.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
