import type { HistoryItem, PredictionResult } from '../types/prediction';

export const MOCK_PREDICTION_RESULTS: PredictionResult[] = [
  {
    id: 'pred-2026-001',
    category: 'Very Severe Cyclonic Storm',
    windSpeedKmh: 145,
    windSpeedKnots: 78,
    confidence: 94.2,
    trend: 'Intensifying',
    sourcesUsed: 'IR + WV',
    timestamp: new Date().toISOString(),
    irImageName: 'INSAT-3D_IR_BayOfBengal.png',
    wvImageName: 'INSAT-3D_WV_BayOfBengal.png',
    featureScores: {
      eyeStructure: 92.5,
      cloudBandSymmetry: 89.0,
      brightnessTemperatureGradient: 96.4,
      waterVapourConvection: 95.1,
    },
  },
  {
    id: 'pred-2026-002',
    category: 'Severe Cyclonic Storm',
    windSpeedKmh: 105,
    windSpeedKnots: 57,
    confidence: 88.5,
    trend: 'Steady',
    sourcesUsed: 'IR Only',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    irImageName: 'INSAT-3D_IR_ArabianSea.png',
    featureScores: {
      eyeStructure: 81.0,
      cloudBandSymmetry: 86.2,
      brightnessTemperatureGradient: 91.0,
      waterVapourConvection: 0,
    },
  },
];

export const INITIAL_MOCK_HISTORY: HistoryItem[] = [
  {
    id: 'hist-001',
    date: '2026-08-20 14:30 IST',
    cycloneName: 'System BOB-04 (Bay of Bengal)',
    category: 'Very Severe Cyclonic Storm',
    windSpeedKmh: 145,
    confidence: 94.2,
    sourcesUsed: 'IR + WV',
  },
  {
    id: 'hist-002',
    date: '2026-08-18 09:15 IST',
    cycloneName: 'System ARB-02 (Arabian Sea)',
    category: 'Severe Cyclonic Storm',
    windSpeedKmh: 105,
    confidence: 89.1,
    sourcesUsed: 'IR Only',
  },
  {
    id: 'hist-003',
    date: '2026-08-15 18:45 IST',
    cycloneName: 'Depression BOB-03',
    category: 'Deep Depression',
    windSpeedKmh: 58,
    confidence: 91.5,
    sourcesUsed: 'IR + WV',
  },
];

export const PRESET_SATELLITE_IMAGES = {
  irSample1: {
    name: 'INSAT-3D_IR_Cyclone_Alpha.png',
    previewUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%230b132b"/><circle cx="300" cy="200" r="140" fill="none" stroke="%2338bdf8" stroke-width="2" stroke-dasharray="6,6"/><circle cx="300" cy="200" r="100" fill="%230284c7" opacity="0.3"/><circle cx="300" cy="200" r="60" fill="%230ea5e9" opacity="0.6"/><circle cx="300" cy="200" r="25" fill="%2338bdf8" opacity="0.8"/><circle cx="300" cy="200" r="8" fill="%23ffffff"/><path d="M 200 200 Q 250 120 300 200 T 400 200" fill="none" stroke="%237dd3fc" stroke-width="4" opacity="0.7"/><path d="M 180 230 Q 260 320 320 220" fill="none" stroke="%2306b6d4" stroke-width="5" opacity="0.8"/><text x="20" y="30" fill="%2306b6d4" font-family="sans-serif" font-size="14" font-weight="bold">INSAT-3D TIR-1 (10.8 µm)</text><text x="20" y="380" fill="%2394a3b8" font-family="sans-serif" font-size="12">Infrared Imagery - Eyewall Brightness Temp</text></svg>',
    sizeBytes: 1024 * 450,
    dimensions: '1024 x 768 px',
  },
  visSample1: {
    name: 'INSAT-3D_VIS_Cyclone_Alpha.png',
    previewUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%2304091a"/><circle cx="300" cy="200" r="145" fill="%2300b0ff" opacity="0.2"/><path d="M 170 180 C 230 100, 370 110, 430 190 C 470 250, 350 330, 280 290 C 210 250, 130 230, 170 180 Z" fill="%2300e5ff" opacity="0.4"/><circle cx="300" cy="200" r="50" fill="%237c4dff" opacity="0.6"/><circle cx="300" cy="200" r="14" fill="%23e0f7fa"/><text x="20" y="30" fill="%2300e5ff" font-family="sans-serif" font-size="14" font-weight="bold">INSAT-3D VIS (0.65 µm)</text><text x="20" y="380" fill="%23a7f3d0" font-family="sans-serif" font-size="12">Visible Spectrum - Cloud Structure Morphology</text></svg>',
    sizeBytes: 1024 * 510,
    dimensions: '1024 x 768 px',
  },
  wvSample1: {
    name: 'INSAT-3D_WV_Cyclone_Alpha.png',
    previewUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23090d16"/><circle cx="300" cy="200" r="150" fill="%231e1b4b" opacity="0.5"/><path d="M 180 160 C 240 80, 360 80, 420 160 C 480 240, 360 320, 300 300 C 240 280, 140 240, 180 160 Z" fill="%234338ca" opacity="0.5"/><circle cx="300" cy="200" r="45" fill="%236366f1" opacity="0.7"/><circle cx="300" cy="200" r="12" fill="%23a5b4fc"/><text x="20" y="30" fill="%23818cf8" font-family="sans-serif" font-size="14" font-weight="bold">INSAT-3D WV (6.8 µm)</text><text x="20" y="380" fill="%2394a3b8" font-family="sans-serif" font-size="12">Water Vapour Channel - Upper Troposphere</text></svg>',
    sizeBytes: 1024 * 380,
    dimensions: '1024 x 768 px',
  },
  pmwSample1: {
    name: 'GPM_GMI_PMW_89GHz.png',
    previewUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="100%" height="100%" fill="%23090806"/><circle cx="300" cy="200" r="135" fill="%2345300b" opacity="0.4"/><circle cx="300" cy="200" r="95" stroke="%23d6a84f" stroke-width="1.5" fill="none" stroke-dasharray="4,4"/><path d="M 210 190 Q 270 120 330 190 T 410 200" fill="none" stroke="%23f2cc72" stroke-width="3" opacity="0.7"/><circle cx="300" cy="200" r="35" fill="%23d6a84f" opacity="0.7"/><circle cx="300" cy="200" r="10" fill="%23faf0d7"/><text x="20" y="30" fill="%23d6a84f" font-family="sans-serif" font-size="14" font-weight="bold">GPM-GMI PMW (89 GHz)</text><text x="20" y="380" fill="%23f2cc72" font-family="sans-serif" font-size="12">Passive Microwave - Internal Deep Convection Radar</text></svg>',
    sizeBytes: 1024 * 620,
    dimensions: '1024 x 768 px',
  },
};
