import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon, CheckCircle2, Scan } from 'lucide-react';
import type { UploadedImageFile } from '../types/prediction';

interface UploadCardProps {
  type: 'IR' | 'WV';
  title: string;
  subtitle: string;
  required?: boolean;
  image: UploadedImageFile | null;
  onImageSelect: (image: UploadedImageFile | null) => void;
  onError: (errorMessage: string) => void;
}

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'];
const MAX_FILE_SIZE_MB = 15;

export const UploadCard: React.FC<UploadCardProps> = ({
  type,
  title,
  subtitle,
  required = false,
  image,
  onImageSelect,
  onError,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const validateAndProcessFile = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(png|jpe?g|webp)$/i)) {
      onError(`Invalid format for ${title}. Upload PNG, JPG, JPEG, or WEBP satellite file.`);
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
    if (file) {
      validateAndProcessFile(file);
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
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className={`relative rounded bg-[#06131D]/80 border transition-all duration-200 overflow-hidden flex flex-col h-full ${
      isDragging
        ? 'border-[#20D4E8] bg-[#087EA4]/20 ring-1 ring-[#20D4E8]/30'
        : 'border-slate-800 hover:border-slate-700'
    }`}>
      {/* Header Telemetry Bar */}
      <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between bg-[#02070d]/60 font-mono">
        <div className="flex items-center space-x-2.5">
          <div className={`p-1.5 rounded ${
            type === 'IR' ? 'bg-[#087EA4]/20 text-[#20D4E8] border border-[#20D4E8]/30' : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20'
          }`}>
            <ImageIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">{title}</h3>
              {required ? (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#20D4E8]/20 text-[#20D4E8] border border-[#20D4E8]/30">
                  REQUIRED
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                  OPTIONAL
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">{subtitle}</p>
          </div>
        </div>

        {image && (
          <div className="flex items-center space-x-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>INGESTED</span>
          </div>
        )}
      </div>

      {/* Ingestion Drop Zone / Preview Area */}
      <div className="p-4 flex-1 flex flex-col justify-center">
        {image ? (
          /* Preview Ingested Satellite File */
          <div className="space-y-3 font-mono">
            <div className="relative group rounded overflow-hidden border border-slate-800 bg-[#02070d] aspect-video flex items-center justify-center">
              <img
                src={image.previewUrl}
                alt={`${type} Satellite Channel Preview`}
                className="w-full h-full object-contain p-2"
              />
              
              {/* Hover Actions Overlay */}
              <div className="absolute inset-0 bg-[#02070d]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 transition-colors cursor-pointer"
                >
                  Replace File
                </button>
                <button
                  type="button"
                  onClick={() => onImageSelect(null)}
                  className="px-3 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs border border-red-500/30 transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              </div>

              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-[#02070d]/90 border border-slate-800 text-[10px] text-slate-300 flex items-center space-x-1">
                <Scan className="w-3 h-3 text-[#20D4E8]" />
                <span>{type === 'IR' ? 'TIR-1 (10.8µm)' : 'WV (6.8µm)'}</span>
              </div>
            </div>

            {/* Ingestion Telemetry Footer */}
            <div className="p-2.5 rounded bg-[#02070d]/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 truncate">
                <FileText className="w-3.5 h-3.5 text-[#20D4E8] shrink-0" />
                <span className="truncate text-slate-300">{image.name}</span>
              </div>
              <div className="flex items-center space-x-2 shrink-0 text-slate-500 text-[10px]">
                <span>{formatFileSize(image.sizeBytes)}</span>
                {image.dimensions && <span className="hidden sm:inline">{image.dimensions}</span>}
              </div>
            </div>
          </div>
        ) : (
          /* Empty Ingestion Area */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[185px] ${
              isDragging
                ? 'border-[#20D4E8] bg-[#087EA4]/10'
                : 'border-slate-800 hover:border-slate-700 bg-[#02070d]/40 hover:bg-[#02070d]/70'
            }`}
          >
            <div className={`p-3 rounded-full mb-2.5 ${
              type === 'IR' ? 'bg-[#087EA4]/15 text-[#20D4E8]' : 'bg-indigo-500/10 text-indigo-300'
            }`}>
              <Upload className="w-5 h-5" />
            </div>

            <p className="text-xs font-semibold text-slate-200 mb-1 font-mono">
              [ Click or Drag Satellite Imagery File ]
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mb-2 leading-relaxed font-sans">
              {type === 'IR'
                ? 'Infrared satellite channel showing cloud top brightness temperatures.'
                : 'Water vapour channel showing upper-level atmospheric moisture.'}
            </p>

            <span className="text-[10px] text-slate-500 font-mono">
              PNG, JPG, JPEG, WEBP (Max {MAX_FILE_SIZE_MB}MB)
            </span>
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
