import React, { useRef, useState, useEffect } from 'react';
import { Upload, X, FileText, CheckCircle2, Scan } from 'lucide-react';
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
        // Metallic Silver Thermal Shimmer & Micro Particles
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

        // Restrained silver scanning beam line
        const scanY = ((Math.sin(step * 0.6) + 1) / 2) * height;
        ctx.strokeStyle = 'rgba(216, 220, 226, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, scanY);
        ctx.lineTo(width, scanY);
        ctx.stroke();

      } else if (selectedChannel === 'VIS') {
        // Cool Luminous Cyan / Indigo Gradient Wave Movement
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
        // Deep Atmospheric Moisture Particles & Vapor Flow
        particles.forEach((p) => {
          p.y -= 0.25;
          if (p.y < 0) p.y = height;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 176, 255, ${p.opacity * 0.6})`;
          ctx.fill();
        });

      } else if (selectedChannel === 'PMW') {
        // Technical Radar Grid & Golden Data Traces
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

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [selectedChannel]);

  const validateAndProcessFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(png|jpe?g|webp)$/i)) {
      onError(`Invalid format. Please upload PNG, JPG, JPEG, or WEBP satellite image.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      onError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;

      const img = new Image();
      img.onload = () => {
        onImageSelect({
          file,
          previewUrl: result,
          name: file.name,
          sizeBytes: file.size,
          dimensions: `${img.width} x ${img.height} px`,
          isPreset: false,
        });
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndProcessFile(file);
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
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndProcessFile(file);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-700 flex flex-col backdrop-blur-2xl shadow-2xl ${
        theme.cardBg
      } ${theme.borderColor} ${theme.borderGlow} ${isDragging ? 'ring-2 scale-[1.005]' : ''}`}
    >
      {/* Dynamic Mode Micro-Animation Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0 opacity-75 rounded-2xl" />

      {/* Header & Mode Dropdown Selector Bar (NO overflow-hidden so popup drops down smoothly!) */}
      <div
        className={`relative z-20 p-5 rounded-t-2xl border-b transition-colors duration-700 flex flex-col md:flex-row md:items-center justify-between gap-4 font-mono ${theme.cardHeaderBg}`}
      >
        <div className="flex items-start sm:items-center space-x-3.5">
          <div
            className="p-2.5 rounded-xl shrink-0 transition-colors duration-700"
            style={{
              backgroundColor: `${theme.accentColor}18`,
              borderColor: `${theme.accentColor}40`,
              color: theme.accentColor,
              borderWidth: 1,
            }}
          >
            {React.createElement(theme.icon, { className: 'w-5 h-5' })}
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h3 className="text-sm font-bold text-white tracking-wide uppercase">{theme.conceptTitle}</h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${theme.badgeStyle}`}>
                {theme.shortCode}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-sans leading-relaxed">{theme.description}</p>
          </div>
        </div>

        {/* 100% Reliable Interactive Channel Dropdown */}
        <div className="shrink-0 relative z-30 pointer-events-auto">
          <ChannelDropdown selectedChannel={selectedChannel} onSelectChannel={onChannelChange} />
        </div>
      </div>

      {/* Satellite Image Preview / Drag & Drop Ingestion Zone */}
      <div className="relative z-10 p-6 flex-1 flex flex-col justify-center min-h-[240px]">
        {image ? (
          /* Preview Ingested Satellite File */
          <div className="space-y-4 font-mono animate-in fade-in zoom-in-95 duration-300">
            <div className="relative group rounded-xl overflow-hidden border border-slate-700/80 bg-[#02050A]/95 aspect-video max-h-[380px] flex items-center justify-center shadow-2xl">
              <img
                src={image.previewUrl}
                alt={`${theme.name} Satellite Channel Preview`}
                className="w-full h-full object-contain p-2"
              />

              {/* Hover Actions Overlay */}
              <div className="absolute inset-0 bg-[#02050A]/85 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-3 pointer-events-auto">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs border border-slate-600 transition-all cursor-pointer font-semibold shadow-lg hover:scale-105"
                >
                  Change Image
                </button>
                <button
                  type="button"
                  onClick={() => onImageSelect(null)}
                  className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs border border-red-500/40 transition-all flex items-center space-x-1.5 cursor-pointer font-semibold shadow-lg hover:scale-105"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>

              {/* Mode Badge Overlay */}
              <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-[#02050A]/90 border border-slate-700 text-xs text-slate-200 flex items-center space-x-2 shadow-lg backdrop-blur-md">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme.accentColor }} />
                <span className="font-bold tracking-wider">{theme.name.toUpperCase()} • {theme.shortCode}</span>
              </div>

              {/* Channel Tag Overlay */}
              <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-md bg-[#02050A]/90 border border-slate-700 text-[11px] text-slate-300 flex items-center space-x-1.5 backdrop-blur-md">
                <Scan className="w-3.5 h-3.5" style={{ color: theme.accentColor }} />
                <span>{theme.tag}</span>
              </div>
            </div>

            {/* Ingestion Telemetry Footer */}
            <div className="p-3.5 rounded-xl bg-[#02050A]/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-between shadow-inner">
              <div className="flex items-center space-x-2.5 truncate">
                <FileText className="w-4 h-4 shrink-0" style={{ color: theme.accentColor }} />
                <span className="truncate font-semibold text-slate-100">{image.name}</span>
                {image.isPreset && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                    PRESET SAMPLE
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-3 shrink-0 text-slate-400 text-xs">
                <span>{formatFileSize(image.sizeBytes)}</span>
                {image.dimensions && <span className="hidden sm:inline border-l border-slate-700 pl-3">{image.dimensions}</span>}
                <div className="flex items-center space-x-1 text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20 text-[10px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>INGESTED</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty Ingestion Drag & Drop Zone */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-500 flex flex-col items-center justify-center min-h-[210px] relative overflow-hidden group ${
              theme.dropZoneBg
            } ${theme.dropZoneHover} ${isDragging ? `${theme.borderColor} scale-[1.01]` : 'border-slate-800'}`}
          >
            <div className={`p-4 rounded-full mb-3 transition-transform duration-300 group-hover:scale-110 shadow-lg ${theme.uploadIconBg}`}>
              <Upload className={`w-6 h-6 ${theme.uploadIconColor}`} />
            </div>

            <p className="text-xs font-bold text-slate-100 mb-1 font-mono tracking-wide">
              [ Click or Drag Satellite Image File ]
            </p>
            <p className="text-xs text-slate-400 max-w-md mb-2 leading-relaxed font-sans">
              {theme.description}
            </p>

            <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
              <span>PNG, JPG, JPEG, WEBP</span>
              <span>•</span>
              <span>Max {MAX_FILE_SIZE_MB}MB</span>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
