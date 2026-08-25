import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, FileText, CheckCircle2, Scan, AlertTriangle } from 'lucide-react';
import type { SatelliteChannel, UploadedImageFile } from '../types/prediction';
import { ChannelDropdown } from './ChannelDropdown';
import { THEMES } from '../theme/themeSystem';

interface AdaptiveUploadCardProps {
  selectedChannel: SatelliteChannel;
  onChannelChange: (channel: SatelliteChannel) => void;
  image: UploadedImageFile | null;
  onImageSelect: (image: UploadedImageFile | null) => void;
  onError: (errorMessage: string) => void;
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE_MB = 15;

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

export const AdaptiveUploadCard: React.FC<AdaptiveUploadCardProps> = ({
  selectedChannel,
  onChannelChange,
  image,
  onImageSelect,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const theme = THEMES[selectedChannel] || THEMES.IR;

  const detectedSpectrum = image ? detectImageSpectrum(image.name, image.uploadedChannel) : null;
  const isSpectrumMismatch = Boolean(detectedSpectrum && detectedSpectrum !== selectedChannel);

  // Particle & micro-animation render loop inside upload container
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 220);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 30 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.6 + 0.2,
    }));

    let animId: number;
    let step = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      step += 0.015;

      if (selectedChannel === 'IR') {
        particles.forEach((p) => {
          p.x += p.speedX;
          p.y += p.speedY;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(216, 220, 226, ${p.opacity * 0.5})`;
          ctx.fill();
        });

        const scanY = ((Math.sin(step * 0.6) + 1) / 2) * height;
        ctx.strokeStyle = 'rgba(216, 220, 226, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(width, scanY);
        ctx.stroke();

      } else if (selectedChannel === 'VIS') {
        const waveGrad = ctx.createLinearGradient(0, 0, width, height);
        waveGrad.addColorStop(0, 'rgba(0, 229, 255, 0.06)');
        waveGrad.addColorStop(1, 'rgba(124, 77, 255, 0.06)');
        ctx.fillStyle = waveGrad;
        ctx.fillRect(0, 0, width, height);

        particles.forEach((p) => {
          p.x += Math.sin(step + p.y * 0.01) * 0.4;
          p.y += Math.cos(step + p.x * 0.01) * 0.3;
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 229, 255, ${p.opacity * 0.6})`;
          ctx.fill();
        });

      } else if (selectedChannel === 'WV') {
        particles.forEach((p) => {
          p.y -= 0.25;
          if (p.y < 0) p.y = height;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 176, 255, ${p.opacity * 0.6})`;
          ctx.fill();
        });

      } else if (selectedChannel === 'PMW') {
        ctx.strokeStyle = 'rgba(214, 168, 79, 0.08)';
        ctx.lineWidth = 1;
        const gridSize = 40;
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
          ctx.fillStyle = `rgba(214, 168, 79, ${p.opacity * 0.6})`;
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
  }, [selectedChannel]);

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      onError(`Invalid file format '${file.name}'. Please upload a PNG, JPG, or WEBP image.`);
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
      onImageSelect({
        file,
        previewUrl: reader.result as string,
        name: file.name,
        sizeBytes: file.size,
        uploadedChannel: selectedChannel, // Store channel mode active at upload
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
    <div className="space-y-4">
      {/* Selector & Channel Info Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <ChannelDropdown
          selectedChannel={selectedChannel}
          onSelectChannel={onChannelChange}
        />
        <div className="text-xs text-slate-400 font-mono flex items-center space-x-1.5 self-end sm:self-center">
          <Scan className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Instrument Mode: <strong className="text-white">{selectedChannel}</strong></span>
        </div>
      </div>

      {/* Mismatch Warning Alert Banner */}
      {isSpectrumMismatch && (
        <div className="p-4 rounded-xl bg-red-950/90 border-2 border-red-500 text-red-200 text-xs font-mono flex items-start space-x-3 shadow-2xl animate-pulse">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-extrabold text-red-300 block text-sm uppercase tracking-wider">
              🛑 SATELLITE SPECTRUM MISMATCH (ANALYSIS BLOCKED)
            </span>
            <p className="text-slate-100">
              The uploaded satellite image belongs to spectrum <strong className="text-white font-bold">[{detectedSpectrum}]</strong>, which does not fit active channel mode <strong className="text-white font-bold">[{selectedChannel}]</strong>.
            </p>
            <p className="text-red-200 text-[11px] font-bold">
              Only genuine <strong className="text-white">[{selectedChannel}]</strong> satellite images can be predicted under <strong className="text-white">[{selectedChannel}]</strong> mode. Please switch mode to <strong className="text-white">[{detectedSpectrum}]</strong> or upload a valid <strong className="text-white">[{selectedChannel}]</strong> image.
            </p>
          </div>
        </div>
      )}

      {/* Main Drag-and-Drop Ingestion Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !image && fileInputRef.current?.click()}
        className={`relative rounded-2xl p-6 sm:p-8 transition-all duration-500 border-2 overflow-hidden cursor-pointer select-none ${
          isDragging
            ? `${theme.dropZoneHover} bg-slate-900/90 scale-[1.01]`
            : image
            ? isSpectrumMismatch
              ? 'border-red-500 bg-red-950/20'
              : 'border-slate-700 bg-[#030814]/90'
            : 'border-slate-800/80 hover:border-slate-700 bg-[#02050D]/80 hover:bg-[#030814]/80'
        }`}
        style={{
          boxShadow: isDragging
            ? `0 0 30px ${theme.accentColor}`
            : isSpectrumMismatch
            ? '0 0 30px rgba(239, 68, 68, 0.3)'
            : '0 10px 30px rgba(0,0,0,0.5)',
        }}
      >
        {/* Background Canvas Particles */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none opacity-60 z-0"
        />

        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="relative z-10">
          {!image ? (
            <div className="flex flex-col items-center justify-center text-center space-y-4 py-4">
              <div
                className={`p-4 rounded-2xl border transition-transform duration-300 hover:scale-110 ${theme.uploadIconBg} ${theme.badgeStyle}`}
              >
                <Upload className="w-8 h-8" style={{ color: theme.accentColor }} />
              </div>

              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Drop {selectedChannel} Satellite Image or Click to Browse
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Supports multi-spectral INSAT-3D, GOES, or GPM satellite files (PNG, JPG, WEBP up to 15MB).
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] font-mono text-slate-400">
                <span className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800">
                  Target Mode: <strong style={{ color: theme.accentColor }}>{selectedChannel}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800">
                  Max 15MB
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              {/* Preview Image Thumbnail */}
              <div className="relative group shrink-0">
                <img
                  src={image.previewUrl}
                  alt="Satellite Upload Preview"
                  className={`w-36 h-36 sm:w-44 sm:h-44 object-cover rounded-xl border shadow-2xl transition-transform duration-300 group-hover:scale-105 ${
                    isSpectrumMismatch ? 'border-red-500' : 'border-slate-700'
                  }`}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onImageSelect(null);
                  }}
                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg transition-transform hover:scale-110 cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Upload Meta Information */}
              <div className="flex-1 space-y-3 text-center md:text-left">
                <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono border ${
                  isSpectrumMismatch
                    ? 'bg-red-950/80 text-red-300 border-red-500/60'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}>
                  {isSpectrumMismatch ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                      <span>Spectrum Mismatch (Analysis Blocked)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Satellite Image Registered ({selectedChannel})</span>
                    </>
                  )}
                </div>

                <div>
                  <h4 className="text-base font-bold text-white truncate max-w-md font-mono">
                    {image.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    File Size: {(image.sizeBytes / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-[11px] font-mono">
                  <span className="px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800 flex items-center space-x-1">
                    <FileText className="w-3 h-3 text-slate-400" />
                    <span>Mode: {selectedChannel}</span>
                  </span>
                  {detectedSpectrum && (
                    <span className={`px-2.5 py-1 rounded-lg border flex items-center space-x-1 ${
                      isSpectrumMismatch
                        ? 'bg-red-950 text-red-300 border-red-500/60 font-bold'
                        : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                    }`}>
                      <span>Detected Spectrum: {detectedSpectrum}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
