import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { apiService, type SampleImageItem } from '../services/api';
import type { SatelliteChannel, UploadedImageFile } from '../types/prediction';

const rawBaseUrl =
  (import.meta.env.VITE_API_BASE_URL as string) ||
  (typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000'
    : 'https://four04-o7bi.onrender.com');
const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

interface SampleLibraryProps {
  activeChannel: SatelliteChannel;
  onSelectSample: (
    irImage: UploadedImageFile,
    wvImage: UploadedImageFile | null,
    sample: SampleImageItem,
    previewChannel?: SatelliteChannel
  ) => void;
}

export const SampleLibrary: React.FC<SampleLibraryProps> = ({ onSelectSample }) => {
  const [samples, setSamples] = useState<SampleImageItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingSampleId, setLoadingSampleId] = useState<string | null>(null);
  const [channelMap, setChannelMap] = useState<Record<string, 'IR' | 'WV'>>({});

  useEffect(() => {
    fetchSamples();
  }, []);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const data = await apiService.getSampleImages();
      setSamples(data);
    } catch (e) {
      console.warn('Failed to load sample images:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (sample: SampleImageItem) => {
    const previewCh = channelMap[sample.id] || 'IR';
    setLoadingSampleId(sample.id);
    try {
      // Fetch IR file from API / fallback
      const irFile = await apiService.getSampleImageFile(sample.id, 'ir');
      const irPreviewUrl = URL.createObjectURL(irFile);

      const irUploadedFile: UploadedImageFile = {
        file: irFile,
        previewUrl: irPreviewUrl,
        name: sample.ir_filename,
        sizeBytes: irFile.size,
        uploadedChannel: 'IR',
      };

      let wvUploadedFile: UploadedImageFile | null = null;
      if (sample.wv_filename) {
        try {
          const wvFile = await apiService.getSampleImageFile(sample.id, 'wv');
          const wvPreviewUrl = URL.createObjectURL(wvFile);
          wvUploadedFile = {
            file: wvFile,
            previewUrl: wvPreviewUrl,
            name: sample.wv_filename,
            sizeBytes: wvFile.size,
            uploadedChannel: 'WV',
          };
        } catch (e) {
          console.warn('WV sample fetch failed:', e);
        }
      }

      onSelectSample(irUploadedFile, wvUploadedFile, sample, previewCh);
    } catch (err) {
      console.error('Failed to load sample image file:', err);
    } finally {
      setLoadingSampleId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 rounded-2xl bg-[#02050D]/80 border border-slate-800/80 flex items-center justify-center space-x-3 text-slate-400 font-mono text-xs">
        <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
        <span>Loading Genuine Satellite Sample Library...</span>
      </div>
    );
  }

  if (samples.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
            Test With Historical Satellite Observations
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Raw Multi-Spectral Cases ({samples.length} Available)
        </span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {samples.map((sample, idx) => {
          const isSelectedLoading = loadingSampleId === sample.id;
          const currentChannel = channelMap[sample.id] || 'IR';
          const hasWV = Boolean(sample.wv_filename);
          
          // Neutral storm identification without revealing ground-truth category or windspeed
          const stormId = sample.display_name.includes('—')
            ? sample.display_name.split('—')[1].trim()
            : `IO-SYS-${idx + 1}`;
          const cleanTitle = `Observation System ${stormId}`;

          const primaryUrl = `${API_BASE_URL}/api/v1/sample-images/${sample.id}/${currentChannel.toLowerCase()}`;
          const fallbackUrl = `/sample_images/${sample.id}_${currentChannel.toLowerCase()}.png`;

          return (
            <div
              key={sample.id}
              onClick={() => !isSelectedLoading && handleCardClick(sample)}
              className={`group relative rounded-xl p-3 bg-[#030814]/90 border border-slate-800/80 hover:border-cyan-500/50 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-cyan-950/30 flex flex-col justify-between ${
                isSelectedLoading ? 'opacity-70 pointer-events-none' : 'hover:-translate-y-0.5'
              }`}
            >
              {/* Image Thumbnail Container */}
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-800/50 mb-2.5">
                <img
                  src={primaryUrl}
                  alt={cleanTitle}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== window.location.origin + fallbackUrl) {
                      target.src = fallbackUrl;
                    }
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent pointer-events-none" />

                {/* Per-card IR / WV Channel Toggle Switch */}
                {hasWV ? (
                  <div
                    className="absolute top-1.5 right-1.5 z-20 flex items-center p-0.5 rounded-lg bg-black/85 backdrop-blur-md border border-slate-700/80 shadow-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setChannelMap((prev) => ({ ...prev, [sample.id]: 'IR' }));
                      }}
                      className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded transition-colors cursor-pointer ${
                        currentChannel === 'IR'
                          ? 'bg-cyan-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Preview Infrared (Thermal IR) Channel"
                    >
                      IR
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setChannelMap((prev) => ({ ...prev, [sample.id]: 'WV' }));
                      }}
                      className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded transition-colors cursor-pointer ${
                        currentChannel === 'WV'
                          ? 'bg-blue-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Preview Water Vapor (Absorption WV) Channel"
                    >
                      WV
                    </button>
                  </div>
                ) : (
                  <div className="absolute top-1.5 right-1.5 z-10 px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 text-[9px] font-mono font-bold">
                    IR
                  </div>
                )}

                {/* Bottom Overlay Pill: Channel Preview indicator */}
                <div className="absolute bottom-1.5 left-1.5 flex items-center space-x-1 pointer-events-none">
                  <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-sm text-slate-300 border border-slate-800 text-[9px] font-mono">
                    View: <strong className={currentChannel === 'IR' ? 'text-cyan-400' : 'text-blue-400'}>{currentChannel}</strong>
                    {hasWV && <span className="text-slate-500 ml-1">(IR+WV Ready)</span>}
                  </span>
                </div>

                {isSelectedLoading && (
                  <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center space-x-2 text-cyan-400 text-xs font-mono z-30">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                )}
              </div>

              {/* Text Info: Clean observation info without cyclone category name or wind speed */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1 font-mono">
                  {cleanTitle}
                </h4>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="text-slate-300">Basin: North Indian Ocean</span>
                  <span className="text-cyan-400/90">{hasWV ? 'IR + WV' : 'IR'}</span>
                </div>
              </div>

              {/* Action Button CTA */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400 group-hover:text-cyan-400">
                <span>Select & Ingest</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

