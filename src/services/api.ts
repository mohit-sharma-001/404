import type { HistoryItem, PredictionResult, SatelliteChannel, UploadedImageFile } from '../types/prediction';
import { INITIAL_MOCK_HISTORY, MOCK_PREDICTION_RESULTS } from '../data/mockPrediction';

export interface AnalyzeCycloneParams {
  channel: SatelliteChannel;
  image: UploadedImageFile;
  // Legacy optional fields for backward compatibility
  irImage?: UploadedImageFile;
  wvImage?: UploadedImageFile | null;
}

export interface CycloneApiService {
  analyzeCyclone(params: AnalyzeCycloneParams): Promise<PredictionResult>;
  getHistory(): Promise<HistoryItem[]>;
}

class MockCycloneApiServiceImpl implements CycloneApiService {
  private history: HistoryItem[] = [...INITIAL_MOCK_HISTORY];

  /**
   * Simulates AI Model Inference API call for multi-channel satellite ingestion.
   * Model inference is fully calibrated for Infrared (IR).
   * Non-IR channels clearly report model calibration status (Rule 11).
   */
  async analyzeCyclone(params: AnalyzeCycloneParams): Promise<PredictionResult> {
    const channel = params.channel || 'IR';
    const image = params.image || params.irImage;

    if (!image) {
      throw new Error(`Satellite imagery is required for channel ${channel}. Please upload an image.`);
    }

    // Simulate Network Latency / Model Execution Time
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const isIR = channel === 'IR';
    const channelLabelMap: Record<SatelliteChannel, string> = {
      IR: 'IR Only',
      VIS: 'VIS Only (Experimental)',
      WV: 'WV Only (Experimental)',
      PMW: 'PMW Only (Experimental)',
    };

    const sourcesUsed = channelLabelMap[channel] || `${channel} Only`;

    // Dynamic confidence score
    const confidence = isIR
      ? Math.floor(Math.random() * 5 + 91) + Math.round(Math.random() * 9) / 10 // 91.0 - 96.0%
      : 85.0; // Standard baseline for non-calibrated channel simulation

    const baseResult = MOCK_PREDICTION_RESULTS[0];

    const modelNotice = !isIR
      ? `AI inference pipeline is currently optimized for Infrared (IR) thermal gradient model. Channel ${channel} imagery (${image.name}) has been registered into the multi-channel pipeline.`
      : undefined;

    const newPrediction: PredictionResult = {
      ...baseResult,
      id: `pred-${Date.now()}`,
      confidence,
      sourcesUsed,
      channelUsed: channel,
      timestamp: new Date().toISOString(),
      uploadedImageName: image.name,
      irImageName: isIR ? image.name : undefined,
      modelNotice,
      featureScores: {
        eyeStructure: isIR ? 92.5 : 78.0,
        cloudBandSymmetry: isIR ? 89.0 : 81.5,
        brightnessTemperatureGradient: isIR ? 96.4 : 70.0,
        waterVapourConvection: channel === 'WV' ? 94.2 : 0,
      },
    };

    // Add to localized history list
    const newHistoryEntry: HistoryItem = {
      id: `hist-${Date.now()}`,
      date: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      cycloneName: `Analysis Run #${this.history.length + 1} (${channel})`,
      category: newPrediction.category,
      windSpeedKmh: newPrediction.windSpeedKmh,
      confidence: newPrediction.confidence,
      sourcesUsed,
    };

    this.history.unshift(newHistoryEntry);

    return newPrediction;
  }

  async getHistory(): Promise<HistoryItem[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...this.history];
  }
}

// Singleton API Service instance
export const apiService: CycloneApiService = new MockCycloneApiServiceImpl();

