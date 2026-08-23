import React, { useState } from 'react';
import { Wind } from 'lucide-react';
import { CYCLONE_CATEGORIES } from '../data/cycloneCategories';
import type { CycloneCategoryType } from '../types/prediction';

interface CategoryScaleProps {
  predictedCategory?: CycloneCategoryType | null;
}

export const CategoryScale: React.FC<CategoryScaleProps> = ({ predictedCategory }) => {
  const [selectedCat, setSelectedCat] = useState<CycloneCategoryType | null>(null);

  const activeCategoryName = predictedCategory || selectedCat;

  return (
    <div className="rounded bg-[#06131D]/80 border border-slate-800 p-5 space-y-5 font-mono">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Wind className="w-4 h-4 text-[#20D4E8]" />
            <h3 className="text-sm font-bold text-white tracking-wider uppercase">
              IMD TROPICAL CYCLONE INTENSITY SPECTRUM
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-sans">
            Official India Meteorological Department (IMD) 3-minute sustained surface wind speed classification
          </p>
        </div>

        {predictedCategory ? (
          <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-[#087EA4]/20 border border-[#20D4E8]/30 text-[#20D4E8] text-xs">
            <span className="w-2 h-2 rounded-full bg-[#20D4E8] animate-ping" />
            <span className="font-semibold">PREDICTED STAGE HIGHLIGHTED</span>
          </div>
        ) : (
          <div className="text-xs text-slate-500">
            [ Select Category to Inspect ]
          </div>
        )}
      </div>

      {/* Visual Intensity Spectrum Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {CYCLONE_CATEGORIES.map((cat) => {
          const isPredicted = predictedCategory === cat.name;
          const isSelected = selectedCat === cat.name;

          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => setSelectedCat(isSelected ? null : cat.name)}
              className={`relative rounded p-3 text-left transition-all duration-200 flex flex-col justify-between h-28 border cursor-pointer ${
                isPredicted
                  ? 'bg-[#02070d] border-[#20D4E8] ring-2 ring-[#20D4E8]/40 scale-[1.03] z-10'
                  : isSelected
                  ? 'bg-[#02070d] border-slate-600 ring-1 ring-slate-500'
                  : 'bg-[#02070d]/50 hover:bg-[#02070d] border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Progressive Color Strip */}
              <div
                className="absolute top-0 left-2 right-2 h-1 rounded-b"
                style={{ backgroundColor: cat.color }}
              />

              <div className="pt-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800">
                    {cat.shortCode}
                  </span>
                  {isPredicted && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#20D4E8] opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#20D4E8]" />
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-semibold text-white mt-2 line-clamp-2 leading-snug font-sans">
                  {cat.name}
                </h4>
              </div>

              <div className="border-t border-slate-800/60 pt-1.5 text-[10px] text-slate-400">
                <span>{cat.minSpeedKmh}-{cat.maxSpeedKmh} km/h</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected / Predicted Category Detail Card */}
      {activeCategoryName && (
        <div className="p-4 rounded bg-[#02070d]/80 border border-slate-800 text-xs space-y-2">
          {CYCLONE_CATEGORIES.filter((c) => c.name === activeCategoryName).map((cat) => (
            <div key={cat.name} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <h4 className="text-sm font-bold text-white">{cat.name} ({cat.shortCode})</h4>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border font-mono ${cat.badgeBg}`}>
                    {cat.minSpeedKnots}-{cat.maxSpeedKnots} knots
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed pl-5 text-xs">{cat.description}</p>
              </div>

              <div className="flex items-center space-x-4 pl-5 sm:pl-0 shrink-0 font-mono text-slate-400 bg-[#06131D] p-2.5 rounded border border-slate-800">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">SPEED KM/H</div>
                  <div className="text-sm font-bold text-white">{cat.minSpeedKmh}-{cat.maxSpeedKmh}</div>
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">KNOTS</div>
                  <div className="text-sm font-bold text-[#20D4E8]">{cat.minSpeedKnots}-{cat.maxSpeedKnots}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
