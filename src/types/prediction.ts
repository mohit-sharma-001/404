export type CycloneCategoryType =
  | 'Depression'
  | 'Deep Depression'
  | 'Cyclonic Storm'
  | 'Severe Cyclonic Storm'
  | 'Very Severe Cyclonic Storm'
  | 'Extremely Severe Cyclonic Storm'
  | 'Super Cyclonic Storm';

export type TrendType = 'Intensifying' | 'Weakening' | 'Steady';

export type SatelliteChannel = 'IR' | 'VIS' | 'WV' | 'PMW';

export type SatelliteSourceType = 'IR Only' | 'IR + WV' | 'VIS Only' | 'WV Only' | 'PMW Only';

export interface CycloneCategoryInfo {
  name: CycloneCategoryType;
  shortCode: string;
  minSpeedKmh: number;
  maxSpeedKmh: number;
  minSpeedKnots: number;
  maxSpeedKnots: number;
  color: string;
  badgeBg: string;
  description: string;
}

export interface PredictionResult {
  id: string;
  category: CycloneCategoryType;
  windSpeedKmh: number;
  windSpeedKnots: number;
  confidence: number; // 0 - 100 percentage
  trend: TrendType;
  sourcesUsed: SatelliteSourceType | string;
  channelUsed?: SatelliteChannel;
  timestamp: string;
  irImageName?: string;
  wvImageName?: string;
  uploadedImageName?: string;
  modelNotice?: string;
  featureScores?: {
    eyeStructure: number;
    cloudBandSymmetry: number;
    brightnessTemperatureGradient: number;
    waterVapourConvection: number;
  };
}

export interface HistoryItem {
  id: string;
  date: string;
  cycloneName?: string;
  category: CycloneCategoryType;
  windSpeedKmh: number;
  confidence: number;
  sourcesUsed: SatelliteSourceType | string;
  irThumbnail?: string;
  wvThumbnail?: string;
}

export interface UploadedImageFile {
  file?: File;
  previewUrl: string;
  name: string;
  sizeBytes: number;
  dimensions?: string;
  isPreset?: boolean;
}

export interface UploadedImagesState {
  channel: SatelliteChannel;
  image: UploadedImageFile | null;
}

export type AnalysisStatus = 'idle' | 'analyzing' | 'success' | 'error';

