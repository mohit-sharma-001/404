import React, { useEffect, useState } from 'react';
import { Play, RefreshCw, AlertTriangle } from 'lucide-react';
import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { AdaptiveUploadCard, detectImageSpectrum } from '../components/AdaptiveUploadCard';
import { PresetSelector } from '../components/PresetSelector';
import { PredictionCard } from '../components/PredictionCard';
import { CategoryScale } from '../components/CategoryScale';
import { TrackPredictionSection } from '../components/TrackPredictionSection';
import { HistorySection } from '../components/HistorySection';
import { AdvisoryNote } from '../components/AdvisoryNote';
import { ErrorAlert } from '../components/ErrorAlert';
import { DestructionAlertModal } from '../components/DestructionAlertModal';
import { TargetCursor } from '../components/effects/TargetCursor';
import { OceanBackground } from '../components/effects/OceanBackground';
import { apiService } from '../services/api';
import { THEMES } from '../theme/themeSystem';
import type {
  AnalysisStatus,
  HistoryItem,
  PredictionResult,
  SatelliteChannel,
  UploadedImageFile,
} from '../types/prediction';

export const Dashboard: React.FC = () => {
  const [selectedChannel, setSelectedChannel] = useState<SatelliteChannel>('IR');
  const [uploadedImage, setUploadedImage] = useState<UploadedImageFile | null>(null);
  const [wvUploadedImage, setWvUploadedImage] = useState<UploadedImageFile | null>(null);

  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDestructionAlertOpen, setIsDestructionAlertOpen] = useState<boolean>(false);

  const detectedSpectrum = uploadedImage ? detectImageSpectrum(uploadedImage.name, uploadedImage.uploadedChannel) : null;
  const isSpectrumMismatch = Boolean(
    detectedSpectrum && detectedSpectrum !== selectedChannel
  );

  // Load history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const items = await apiService.getHistory();
      setHistory(items);
    } catch (err) {
      console.error('Failed to load history', err);
    }
  };

  const handleChannelSelect = (channel: SatelliteChannel) => {
    setSelectedChannel(channel);
    setError(null);
  };

  const handleImageSelect = (img: UploadedImageFile | null) => {
    setUploadedImage(img);
    setWvUploadedImage(null);
    setError(null);
  };

  const handleLoadPreset = (channel: SatelliteChannel, imageFile: UploadedImageFile) => {
    setSelectedChannel(channel);
    setUploadedImage(imageFile);
    setWvUploadedImage(null);
    setError(null);
  };

  const scrollToTrackSection = () => {
    const trackEl = document.getElementById('track-section');
    if (trackEl) {
      trackEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRunAnalysis = async () => {
    if (!uploadedImage) {
      setError(`Please upload a satellite image for channel ${selectedChannel} or select a sample preset.`);
      return;
    }

    if (isSpectrumMismatch) {
      setError(
        `Spectral Mismatch Error: Uploaded image source [${detectedSpectrum}] does not match active mode [${selectedChannel}]. Analysis cannot be run on mismatched satellite imagery. Please upload a valid [${selectedChannel}] satellite image or switch mode to [${detectedSpectrum}].`
      );
      return;
    }

    setError(null);
    setStatus('analyzing');
    setPrediction(null);
    setIsDestructionAlertOpen(false);

    // Scroll to prediction section smoothly
    const predictionEl = document.getElementById('prediction-section');
    if (predictionEl) {
      predictionEl.scrollIntoView({ behavior: 'smooth' });
    }

    try {
      const result = await apiService.analyzeCyclone({
        channel: selectedChannel,
        image: uploadedImage,
        irImage: uploadedImage,
        wvImage: wvUploadedImage,
      });

      setPrediction(result);
      setStatus('success');

      // Check if wind speed is 100 km/h or above -> Pop up alert automatically!
      if (result.windSpeedKmh >= 100) {
        setIsDestructionAlertOpen(true);
      }

      // Refresh history list
      fetchHistory();
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'An error occurred during cyclone pattern classification.');
    }
  };

  const handleResetAnalysis = () => {
    setStatus('idle');
    setPrediction(null);
    setError(null);
    setIsDestructionAlertOpen(false);
  };

  const currentTheme = THEMES[selectedChannel] || THEMES.IR;

  return (
    <div className="relative min-h-screen flex flex-col bg-[#03060B] text-slate-100 selection:bg-slate-700 selection:text-white transition-colors duration-700">
      
      {/* Background Layer: Multi-Channel 4-Engine Atmosphere */}
      <OceanBackground activeChannel={selectedChannel} />

      {/* Foreground Layer: Target Cursor Component */}
      <TargetCursor color={currentTheme.accentColor} />

      {/* High Wind Speed Destruction Warning Popup Alert Modal */}
      <DestructionAlertModal
        isOpen={isDestructionAlertOpen}
        prediction={prediction}
        onClose={() => setIsDestructionAlertOpen(false)}
        onViewTrack={scrollToTrackSection}
      />

      {/* 1. Header & Navigation */}
      <Header activeChannel={selectedChannel} />

      {/* 2. Hero Section */}
      <HeroSection activeChannel={selectedChannel} />

      {/* Main Core MVP Container */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        
        {/* Global Error Alert Banner */}
        <ErrorAlert message={error} onDismiss={() => setError(null)} />

        {/* 3. Ingestion & Upload Section */}
        <section id="analysis-section" className="space-y-6">
          <div className={`border-b pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors duration-700 ${currentTheme.sectionDivider}`}>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Adaptive Satellite Data Ingestion
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Unified multi-spectral satellite imagery processing pipeline (IR, VIS, WV, PMW)
              </p>
            </div>
            <div className={`px-2.5 py-1 rounded-md border text-[11px] font-mono text-slate-300 self-start sm:self-auto transition-colors duration-700 ${currentTheme.statusPillBg} ${currentTheme.statusPillBorder}`}>
              Active Mode: <span className="font-bold" style={{ color: currentTheme.accentColor }}>{selectedChannel}</span>
            </div>
          </div>

          {/* Sample Preset Loader */}
          <PresetSelector onLoadPreset={handleLoadPreset} activeChannel={selectedChannel} />

          {/* Unified Single Adaptive Upload Component */}
          <AdaptiveUploadCard
            selectedChannel={selectedChannel}
            onChannelChange={handleChannelSelect}
            image={uploadedImage}
            onImageSelect={handleImageSelect}
            onError={(msg) => setError(msg)}
          />

          {/* Instrument Action Control Bar */}
          <div className="p-5 rounded-2xl bg-[#03070E]/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-2xl shadow-2xl">
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white block">Ready for Analysis Pipeline</span>
              {isSpectrumMismatch ? (
                <div className="flex items-center space-x-1.5 text-xs text-red-400 font-mono font-bold mt-0.5">
                  <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse shrink-0" />
                  <span>ANALYSIS BLOCKED: Image spectrum [{detectedSpectrum}] does not match active mode [{selectedChannel}]</span>
                </div>
              ) : (
                <span className="text-slate-400 font-mono">
                  {uploadedImage
                    ? `[${selectedChannel}] Ingested file: ${uploadedImage.name}`
                    : `Upload a satellite image under mode [${selectedChannel}] or select a preset above`}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={!uploadedImage || status === 'analyzing' || isSpectrumMismatch}
              className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs font-mono uppercase tracking-wider transition-all duration-300 shadow-xl flex items-center justify-center space-x-2 shrink-0 cursor-pointer select-none active:scale-95 ${
                !uploadedImage || status === 'analyzing' || isSpectrumMismatch
                  ? 'bg-red-950/40 text-red-400 border border-red-800/80 cursor-not-allowed opacity-80'
                  : currentTheme.primaryBtn
              }`}
            >
              {status === 'analyzing' ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-current" />
                  <span>Processing {selectedChannel} Analysis...</span>
                </>
              ) : isSpectrumMismatch ? (
                <span>⚠️ Mismatched Spectrum ({detectedSpectrum} vs {selectedChannel})</span>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-current" />
                  <span>Run Cyclone Analysis</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* 4. Prediction & Intensity Forecast Section */}
        <section id="prediction-section" className="space-y-4">
          <div className={`border-b pb-3 transition-colors duration-700 ${currentTheme.sectionDivider}`}>
            <h2 className="text-xl font-bold text-white tracking-tight">
              AI Prediction & Classification
            </h2>
          </div>

          <PredictionCard
            status={status}
            prediction={prediction}
            onReset={handleResetAnalysis}
            onOpenDestructionAlert={() => setIsDestructionAlertOpen(true)}
            onViewTrack={scrollToTrackSection}
          />
        </section>

        {/* 5. IMD Category Intensity Scale */}
        <section id="category-scale">
          <CategoryScale predictedCategory={prediction?.category} />
        </section>

        {/* 6. Cyclone Track Prediction Section */}
        <TrackPredictionSection activeChannel={selectedChannel} prediction={prediction} />

        {/* 7. Recent Historical Predictions Log */}
        <section id="history-section">
          <HistorySection
            history={history}
            onRefresh={fetchHistory}
            onSelectHistoryItem={() => {}}
          />
        </section>

      </main>

      {/* 8. Advisory Disclaimer Footer */}
      <AdvisoryNote activeChannel={selectedChannel} />
    </div>
  );
};
