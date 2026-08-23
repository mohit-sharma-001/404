import React from 'react';
import { Sparkles } from 'lucide-react';
import { PRESET_SATELLITE_IMAGES } from '../data/mockPrediction';
import type { SatelliteChannel, UploadedImageFile } from '../types/prediction';
import { THEMES } from '../theme/themeSystem';

interface PresetSelectorProps {
  onLoadPreset: (channel: SatelliteChannel, image: UploadedImageFile) => void;
  activeChannel?: SatelliteChannel;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({ onLoadPreset, activeChannel = 'IR' }) => {
  const currentTheme = THEMES[activeChannel] || THEMES.IR;

  const handleLoadChannelPreset = (channel: SatelliteChannel) => {
    let presetKey: keyof typeof PRESET_SATELLITE_IMAGES = 'irSample1';

    if (channel === 'VIS') presetKey = 'visSample1';
    else if (channel === 'WV') presetKey = 'wvSample1';
    else if (channel === 'PMW') presetKey = 'pmwSample1';

    const presetData = PRESET_SATELLITE_IMAGES[presetKey];

    const imageFile: UploadedImageFile = {
      previewUrl: presetData.previewUrl,
      name: presetData.name,
      sizeBytes: presetData.sizeBytes,
      dimensions: presetData.dimensions,
      isPreset: true,
    };

    onLoadPreset(channel, imageFile);
  };

  const channelKeys: SatelliteChannel[] = ['IR', 'VIS', 'WV', 'PMW'];

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border backdrop-blur-xl transition-all duration-700 text-xs font-mono shadow-lg ${currentTheme.cardBg} ${currentTheme.borderColor}`}>
      <div className="flex items-center space-x-2 text-slate-300">
        <Sparkles className="w-4 h-4 shrink-0" style={{ color: currentTheme.accentColor }} />
        <span className="font-bold tracking-wide text-slate-200 uppercase">Preset Ingestion Telemetry:</span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {channelKeys.map((chKey) => {
          const theme = THEMES[chKey];
          const Icon = theme.icon;
          const isActive = chKey === activeChannel;

          return (
            <button
              key={chKey}
              type="button"
              onClick={() => handleLoadChannelPreset(chKey)}
              className={`px-3 py-1.5 rounded-lg border transition-all duration-300 flex items-center space-x-2 cursor-pointer font-bold select-none ${
                isActive
                  ? `${theme.secondaryBtn} ring-1 ring-offset-0 scale-[1.02]`
                  : 'bg-[#02050A]/80 hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: theme.accentColor }} />
              <span>{chKey} Preset</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};


