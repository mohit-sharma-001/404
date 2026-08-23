import { Flame, Eye, Waves, Radio } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { SatelliteChannel } from '../types/prediction';

export interface ThemeConfig {
  id: SatelliteChannel;
  name: string;
  shortCode: string;
  tag: string;
  description: string;
  conceptTitle: string;
  icon: LucideIcon;
  
  // Visual world palette & background language
  bgMode: 'thermal_scan' | 'orbital_earth' | 'atmospheric_vapor' | 'scientific_radar';
  bgColors: {
    stop0: string;
    stop1: string;
    stop2: string;
    hazeRgb: { r: number; g: number; b: number };
  };

  // Card & Container Styling
  cardBg: string;
  cardHeaderBg: string;
  borderColor: string;
  borderGlow: string;
  accentColor: string;
  accentSecondary: string;
  badgeStyle: string;
  
  // Instrument Button Styling
  primaryBtn: string;
  secondaryBtn: string;
  
  // Upload Zone & Preview
  uploadIconBg: string;
  uploadIconColor: string;
  dropZoneBg: string;
  dropZoneHover: string;
  previewHeaderBg: string;

  // Global Atmosphere Integration
  headerBg: string;
  headerBorder: string;
  heroBg: string;
  heroBorder: string;
  sectionDivider: string;
  eyebrowText: string;
  statusPillBg: string;
  statusPillBorder: string;
  heroCta: string;
}

export const THEMES: Record<SatelliteChannel, ThemeConfig> = {
  IR: {
    id: 'IR',
    name: 'Infrared',
    shortCode: 'IR',
    tag: 'TIR-1 (10.8µm)',
    description: 'Thermal infrared imagery for cloud-top brightness temperature analysis.',
    conceptTitle: 'Upload Thermal Infrared Imagery',
    icon: Flame,
    bgMode: 'thermal_scan',
    bgColors: {
      stop0: '#030406',
      stop1: '#0A0D12',
      stop2: '#12161E',
      hazeRgb: { r: 216, g: 220, b: 226 },
    },
    cardBg: 'bg-[#06080B]/95',
    cardHeaderBg: 'bg-[#030406]/90 border-slate-800/80',
    borderColor: 'border-slate-700/80',
    borderGlow: 'ring-1 ring-slate-400/30 shadow-[0_0_30px_rgba(216,220,226,0.08)]',
    accentColor: '#D8DCE2',
    accentSecondary: '#AEB5BD',
    badgeStyle: 'bg-slate-800/80 text-slate-200 border-slate-600/50',
    primaryBtn: 'bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950 hover:from-white hover:to-slate-300 shadow-[0_0_20px_rgba(244,246,248,0.2)]',
    secondaryBtn: 'bg-[#080B10]/90 hover:bg-slate-800/80 text-slate-300 hover:text-white border-slate-700/80',
    uploadIconBg: 'bg-slate-800/50 border border-slate-600/50',
    uploadIconColor: 'text-[#D8DCE2]',
    dropZoneBg: 'bg-[#040608]/60',
    dropZoneHover: 'hover:bg-[#070A0E]/80 border-slate-600',
    previewHeaderBg: 'bg-[#030406]/90',
    headerBg: 'bg-[#040608]/90',
    headerBorder: 'border-slate-800/90',
    heroBg: 'bg-[#040608]/40',
    heroBorder: 'border-slate-800/80',
    sectionDivider: 'border-slate-800/80',
    eyebrowText: 'text-slate-300',
    statusPillBg: 'bg-slate-900/80',
    statusPillBorder: 'border-slate-700/80',
    heroCta: 'bg-slate-200 hover:bg-white text-slate-950 shadow-slate-200/15',
  },
  VIS: {
    id: 'VIS',
    name: 'Visible',
    shortCode: 'VIS',
    tag: 'VIS (0.65µm)',
    description: 'Visible-spectrum imagery for cloud morphology & storm-system structure.',
    conceptTitle: 'Upload Visible Satellite Imagery',
    icon: Eye,
    bgMode: 'orbital_earth',
    bgColors: {
      stop0: '#020817',
      stop1: '#06122E',
      stop2: '#0A1B3F',
      hazeRgb: { r: 0, g: 229, b: 255 },
    },
    cardBg: 'bg-[#040E1B]/95',
    cardHeaderBg: 'bg-[#020710]/90 border-cyan-900/40',
    borderColor: 'border-cyan-500/40',
    borderGlow: 'ring-1 ring-[#00E5FF]/40 shadow-[0_0_35px_rgba(0,229,255,0.18)]',
    accentColor: '#00E5FF',
    accentSecondary: '#7C4DFF',
    badgeStyle: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
    primaryBtn: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:from-cyan-300 hover:to-blue-400 shadow-[0_0_25px_rgba(0,229,255,0.3)]',
    secondaryBtn: 'bg-[#030D1A]/90 hover:bg-cyan-950/60 text-cyan-300 hover:text-white border-cyan-800/60',
    uploadIconBg: 'bg-cyan-950/60 border border-cyan-500/40',
    uploadIconColor: 'text-[#00E5FF]',
    dropZoneBg: 'bg-[#020A14]/60',
    dropZoneHover: 'hover:bg-[#051426]/80 border-cyan-400',
    previewHeaderBg: 'bg-[#020812]/90',
    headerBg: 'bg-[#020A18]/90',
    headerBorder: 'border-cyan-950/80',
    heroBg: 'bg-[#030F22]/40',
    heroBorder: 'border-cyan-900/50',
    sectionDivider: 'border-cyan-900/50',
    eyebrowText: 'text-[#00E5FF]',
    statusPillBg: 'bg-cyan-950/80',
    statusPillBorder: 'border-cyan-800/80',
    heroCta: 'bg-[#00E5FF] hover:bg-cyan-300 text-slate-950 shadow-[#00E5FF]/20',
  },
  WV: {
    id: 'WV',
    name: 'Water Vapour',
    shortCode: 'WV',
    tag: 'WV (6.8µm)',
    description: 'Upper-troposphere moisture dynamics & atmospheric moisture flow.',
    conceptTitle: 'Upload Water Vapour Satellite Imagery',
    icon: Waves,
    bgMode: 'atmospheric_vapor',
    bgColors: {
      stop0: '#010511',
      stop1: '#030F26',
      stop2: '#071C3D',
      hazeRgb: { r: 0, g: 176, b: 255 },
    },
    cardBg: 'bg-[#020C1B]/95',
    cardHeaderBg: 'bg-[#010510]/90 border-blue-900/40',
    borderColor: 'border-blue-600/40',
    borderGlow: 'ring-1 ring-[#00B0FF]/40 shadow-[0_0_35px_rgba(0,176,255,0.18)]',
    accentColor: '#00B0FF',
    accentSecondary: '#38BDF8',
    badgeStyle: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
    primaryBtn: 'bg-gradient-to-r from-blue-400 to-indigo-500 text-slate-950 hover:from-blue-300 hover:to-indigo-400 shadow-[0_0_25px_rgba(0,176,255,0.3)]',
    secondaryBtn: 'bg-[#020917]/90 hover:bg-blue-950/60 text-blue-300 hover:text-white border-blue-800/60',
    uploadIconBg: 'bg-blue-950/60 border border-blue-500/40',
    uploadIconColor: 'text-[#00B0FF]',
    dropZoneBg: 'bg-[#010712]/60',
    dropZoneHover: 'hover:bg-[#031127]/80 border-blue-400',
    previewHeaderBg: 'bg-[#010612]/90',
    headerBg: 'bg-[#010716]/90',
    headerBorder: 'border-blue-950/80',
    heroBg: 'bg-[#020C20]/40',
    heroBorder: 'border-blue-900/50',
    sectionDivider: 'border-blue-900/50',
    eyebrowText: 'text-[#00B0FF]',
    statusPillBg: 'bg-blue-950/80',
    statusPillBorder: 'border-blue-800/80',
    heroCta: 'bg-[#00B0FF] hover:bg-blue-300 text-slate-950 shadow-[#00B0FF]/20',
  },
  PMW: {
    id: 'PMW',
    name: 'Passive Microwave',
    shortCode: 'PMW',
    tag: 'PMW (89GHz)',
    description: 'Microwave precipitation structure & internal cyclone eyewall radar.',
    conceptTitle: 'Upload Passive Microwave Imagery',
    icon: Radio,
    bgMode: 'scientific_radar',
    bgColors: {
      stop0: '#060504',
      stop1: '#100D09',
      stop2: '#1A150E',
      hazeRgb: { r: 214, g: 168, b: 79 },
    },
    cardBg: 'bg-[#0A0805]/95',
    cardHeaderBg: 'bg-[#050402]/90 border-amber-900/40',
    borderColor: 'border-amber-600/40',
    borderGlow: 'ring-1 ring-[#D6A84F]/40 shadow-[0_0_35px_rgba(214,168,79,0.18)]',
    accentColor: '#D6A84F',
    accentSecondary: '#F2CC72',
    badgeStyle: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
    primaryBtn: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 hover:from-amber-300 hover:to-yellow-400 shadow-[0_0_25px_rgba(214,168,79,0.3)]',
    secondaryBtn: 'bg-[#070603]/90 hover:bg-amber-950/60 text-amber-300 hover:text-white border-amber-800/60',
    uploadIconBg: 'bg-amber-950/60 border border-amber-500/40',
    uploadIconColor: 'text-[#D6A84F]',
    dropZoneBg: 'bg-[#040302]/60',
    dropZoneHover: 'hover:bg-[#0B0805]/80 border-amber-400',
    previewHeaderBg: 'bg-[#040302]/90',
    headerBg: 'bg-[#070503]/90',
    headerBorder: 'border-amber-950/80',
    heroBg: 'bg-[#0D0A06]/40',
    heroBorder: 'border-amber-900/50',
    sectionDivider: 'border-amber-900/50',
    eyebrowText: 'text-[#D6A84F]',
    statusPillBg: 'bg-amber-950/80',
    statusPillBorder: 'border-amber-800/80',
    heroCta: 'bg-[#D6A84F] hover:bg-amber-300 text-slate-950 shadow-[#D6A84F]/20',
  },
};
