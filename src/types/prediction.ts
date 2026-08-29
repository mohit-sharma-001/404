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
  isValidInput?: boolean;
  hasCyclone?: boolean;
  warningMessage?: string;
  centerLat?: number;
  centerLon?: number;
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
  uploadedChannel?: SatelliteChannel;
}

export interface UploadedImagesState {
  channel: SatelliteChannel;
  image: UploadedImageFile | null;
}

export type AnalysisStatus = 'idle' | 'analyzing' | 'success' | 'error';

export interface TrackPredictionRequestParams {
  current_lat: number;
  current_lon: number;
  storm_speed_kts?: number;
  storm_dir_deg?: number;
  past_lat_6h?: number;
  past_lon_6h?: number;
  past_lat_12h?: number;
  past_lon_12h?: number;
  past_lat_24h?: number;
  past_lon_24h?: number;
  dist2land_km?: number;
  month?: number;
}

export interface TrackPointResult {
  latitude: number;
  longitude: number;
  lat?: number;
  lon?: number;
  distance_km?: number;
}

export interface TrackPredictionResponseResult {
  current_location: TrackPointResult;
  forecast_24h: TrackPointResult;
  forecast_48h: TrackPointResult;
  movement_direction: string;
  heading_degrees: number;
  estimated_speed_kmh: number;
  model_metrics?: Record<string, any>;
}
