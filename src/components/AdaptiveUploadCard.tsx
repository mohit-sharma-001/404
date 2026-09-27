import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, CheckCircle2, AlertTriangle, Sparkles, Layers } from 'lucide-react';
import type { SatelliteChannel, UploadedImageFile } from '../types/prediction';
import { THEMES } from '../theme/themeSystem';

export interface AdaptiveUploadCardProps {
  irImage: UploadedImageFile | null;
  wvImage: UploadedImageFile | null;
  visImage: UploadedImageFile | null;
  pmwImage: UploadedImageFile | null;
  onSlotChange: (channel: SatelliteChannel, image: UploadedImageFile | null) => void;
  onError: (errorMessage: string) => void;
  onClearAll?: () => void;
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE_MB = 15;
const CHANNELS: SatelliteChannel[] = ['IR', 'WV', 'VIS', 'PMW'];

export const detectImageSpectrum = (
  filename: string,
  uploadedChannel?: SatelliteChannel
): SatelliteChannel => {
  if (uploadedChannel) return uploadedChannel;
  if (!filename) return 'IR';
  const upper = filename.toUpperCase();
  if (upper.includes('_VIS_') || upper.includes('VIS_CYCLONE') || upper.includes('VISIBLE') || upper.includes('0.65')) return 'VIS';
  if (upper.includes('_WV_') || upper.includes('WV_CYCLONE') || upper.includes('VAPOUR') || upper.includes('VAPOR') || upper.includes('6.8')) return 'WV';
  if (upper.includes('PMW') || upper.includes('MICROWAVE') || upper.includes('GMI') || upper.includes('89GHZ')) return 'PMW';
  if (upper.includes('_IR_') || upper.includes('TIR') || upper.includes('INFRARED') || upper.includes('IR_CYCLONE') || upper.includes('ALPHA') || upper.includes('10.8')) return 'IR';
  
  // Default spectrum for untagged custom uploads is IR
  return 'IR';
};

/**
 * Micro-animation canvas rendered per upload slot to preserve individual channel atmosphere.
 */
const SlotCanvas: React.FC<{ channel: SatelliteChannel }> = ({ channel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 240);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 200);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 16 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.5 + 0.2,
    }));

    let animId: number;
    let step = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      step += 0.015;

      if (channel === 'IR') {
        particles.forEach((p) => {
          p.x += p.speedX;
          p.y += p.speedY;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(216, 220, 226, ${p.opacity * 0.4})`;
          ctx.fill();
        });

        const scanY = ((Math.sin(step * 0.6) + 1) / 2) * height;
        ctx.strokeStyle = 'rgba(216, 220, 226, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(width, scanY);
        ctx.stroke();
      } else if (channel === 'VIS') {
        const waveGrad = ctx.createLinearGradient(0, 0, width, height);
        waveGrad.addColorStop(0, 'rgba(0, 229, 255, 0.04)');
        waveGrad.addColorStop(1, 'rgba(124, 77, 255, 0.04)');
        ctx.fillStyle = waveGrad;
        ctx.fillRect(0, 0, width, height);

        particles.forEach((p) => {
          p.x += Math.sin(step + p.y * 0.01) * 0.35;
          p.y += Math.cos(step + p.x * 0.01) * 0.25;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 229, 255, ${p.opacity * 0.5})`;
          ctx.fill();
        });
      } else if (channel === 'WV') {
        particles.forEach((p) => {
          p.y -= 0.22;
          if (p.y < 0) p.y = height;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 176, 255, ${p.opacity * 0.5})`;
          ctx.fill();
        });
      } else if (channel === 'PMW') {
        ctx.strokeStyle = 'rgba(214, 168, 79, 0.07)';
        ctx.lineWidth = 1;
        const gridSize = 32;
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }

        particles.forEach((p) => {
          p.x += p.speedX * 0.5;
          p.y += p.speedY * 0.5;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(214, 168, 79, ${p.opacity * 0.5})`;
          ctx.fill();
        });
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [channel]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none opacity-50 z-0"
    />
  );
};

interface UploadSlotProps {
  channel: SatelliteChannel;
  image: UploadedImageFile | null;
  onSelectImage: (file: UploadedImageFile | null) => void;
  onError: (msg: string) => void;
}

const UploadSlot: React.FC<UploadSlotProps> = ({
  channel,
  image,
  onSelectImage,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const theme = THEMES[channel] || THEMES.IR;
  const ChannelIcon = theme.icon;

  const detectedSpectrum = image ? detectImageSpectrum(image.name, image.uploadedChannel) : null;
  const isSpectrumMismatch = Boolean(detectedSpectrum && detectedSpectrum !== channel);

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError(`Invalid file format '${file.name}'. Please upload a PNG, JPG, or WEBP image for ${channel}.`);
      return false;
    }
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      onError(`File '${file.name}' is too large (${fileSizeMB.toFixed(1)}MB). Max limit is ${MAX_FILE_SIZE_MB}MB.`);
      return false;
    }
    return true;
  };

  const processFile = (file: File) => {
    if (!validateFile(file)) return;

    const reader = new FileReader();
    reader.onload = () => {
      onSelectImage({
        file,
        previewUrl: reader.result as string,
        name: file.name,
        sizeBytes: file.size,
        uploadedChannel: channel,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !image && fileInputRef.current?.click()}
      className={`relative rounded-2xl p-4 transition-all duration-500 border-2 overflow-hidden flex flex-col justify-between select-none ${
        image ? 'cursor-default' : 'cursor-pointer hover:scale-[1.01]'
      } ${
        isDragging
          ? `${theme.dropZoneHover} bg-slate-900/90 scale-[1.02]`
          : image
          ? isSpectrumMismatch
            ? 'border-red-500/80 bg-red-950/20'
            : `${theme.borderColor} ${theme.cardBg}`
          : 'border-slate-800/80 hover:border-slate-700 bg-[#02050D]/80 hover:bg-[#030814]/80'
      }`}
      style={{
        minHeight: '280px',
        boxShadow: isDragging
          ? `0 0 25px ${theme.accentColor}`
          : image
          ? isSpectrumMismatch
            ? '0 0 25px rgba(239, 68, 68, 0.25)'
            : `0 8px 24px rgba(0,0,0,0.6)`
          : '0 4px 20px rgba(0,0,0,0.4)',
      }}
    >
      {/* Background Particle Animation */}
      {!image && <SlotCanvas channel={channel} />}

      <input
        ref={fileInputRef}
        id={`slot-input-${channel}`}
        data-testid={`slot-input-${channel}`}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Slot Header */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-800/70">
        <div className="flex items-center space-x-2">
          <div
            className="p-1.5 rounded-lg border flex items-center justify-center shrink-0"
            style={{
              borderColor: `${theme.accentColor}40`,
              backgroundColor: `${theme.accentColor}15`,
              color: theme.accentColor,
            }}
          >
            <ChannelIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm text-white font-mono">{channel}</span>
              <span className="text-[10px] text-slate-400 font-mono">({theme.tag.split(' ')[0]})</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono truncate max-w-[130px] sm:max-w-[110px]">
              {theme.name}
            </p>
          </div>
        </div>

        {/* Slot Role Pill */}
        {image ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Attached</span>
          </span>
        ) : channel === 'IR' ? (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-800/80 text-slate-300 border border-slate-700/80">
            Recommended
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-slate-900/80 text-slate-400 border border-slate-800">
            Optional
          </span>
        )}
      </div>

      {/* Slot Body: Empty State or Preview */}
      <div className="relative z-10 my-auto py-3">
        {!image ? (
          <div className="flex flex-col items-center justify-center text-center space-y-3 py-2">
            <div
              className={`p-3.5 rounded-2xl border transition-transform duration-300 hover:scale-110 ${theme.uploadIconBg}`}
            >
              <Upload className="w-6 h-6" style={{ color: theme.accentColor }} />
            </div>

            <div className="space-y-1">
              <h4 className="text-xs font-bold text-white tracking-wide font-mono">
                Drop {channel} Image
              </h4>
              <p className="text-[11px] text-slate-400">
                or click to browse
              </p>
            </div>

            <div className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-slate-900/60 border border-slate-800/60">
              PNG, JPG, WEBP (≤15MB)
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Image Thumbnail Preview */}
            <div className="relative group rounded-xl overflow-hidden border border-slate-700/80 bg-black/40">
              <img
                src={image.previewUrl}
                alt={`${channel} Satellite Preview`}
                className="w-full h-36 object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Remove (X) Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectImage(null);
                }}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-600/90 hover:bg-red-500 text-white shadow-lg transition-transform hover:scale-110 cursor-pointer z-20 backdrop-blur-sm"
                title={`Remove ${channel} image`}
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Tag overlay */}
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md border border-slate-700/60 text-[10px] font-mono text-slate-300">
                {channel} Channel
              </div>
            </div>

            {/* Image Meta Info */}
            <div className="space-y-1">
              <p className="text-xs font-mono font-bold text-white truncate" title={image.name}>
                {image.name}
              </p>
              <p className="text-[11px] font-mono text-slate-400">
                Size: {(image.sizeBytes / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>

            {/* Spectrum Match Warning Badge */}
            {isSpectrumMismatch && (
              <div className="p-2 rounded-lg bg-red-950/80 border border-red-500/60 text-red-300 text-[10px] font-mono flex items-start space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                <span>
                  Spectral alert: file resembles <strong>{detectedSpectrum}</strong>, expected <strong>{channel}</strong>.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slot Footer / Sensor Description */}
      <div className="relative z-10 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-400 flex items-center justify-between">
        <span className="truncate max-w-[170px]">{theme.tag}</span>
        <span style={{ color: theme.accentColor }}>{channel}</span>
      </div>
    </div>
  );
};

export const AdaptiveUploadCard: React.FC<AdaptiveUploadCardProps> = ({
  irImage,
  wvImage,
  visImage,
  pmwImage,
  onSlotChange,
  onError,
  onClearAll,
}) => {
  const slotImages: Record<SatelliteChannel, UploadedImageFile | null> = {
    IR: irImage,
    WV: wvImage,
    VIS: visImage,
    PMW: pmwImage,
  };

  const filledSlotsCount = CHANNELS.filter((ch) => Boolean(slotImages[ch])).length;

  return (
    <div className="space-y-4">
      {/* 1. Header Hint Bar: Multi-Channel Accuracy Notice */}
      <div className="p-3.5 rounded-2xl bg-[#02050D]/90 border border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-cyan-950/70 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-white font-mono tracking-wide">
                Multi-Spectral Ingestion Grid
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Early Fusion Ready
              </span>
            </div>
            <p className="text-xs text-cyan-300/90 font-mono mt-0.5">
              Providing multiple channels improves prediction accuracy
            </p>
          </div>
        </div>

        {/* Counter & Action */}
        <div className="flex items-center space-x-3 self-end sm:self-center">
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              Slots Attached: <strong className="text-white font-bold">{filledSlotsCount} / 4</strong>
            </span>
          </div>

          {filledSlotsCount > 0 && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-xs font-mono text-red-400 hover:text-red-300 underline cursor-pointer transition-colors"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* 2. Four Simultaneous Upload Slots Grid (IR, WV, VIS, PMW) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {CHANNELS.map((channel) => (
          <UploadSlot
            key={channel}
            channel={channel}
            image={slotImages[channel]}
            onSelectImage={(file) => onSlotChange(channel, file)}
            onError={onError}
          />
        ))}
      </div>
    </div>
  );
};
