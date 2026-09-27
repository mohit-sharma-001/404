import React, { useEffect, useState } from 'react';
import { Play, RefreshCw, Mail } from 'lucide-react';
import { Header } from '../components/Header';
import { HeroSection } from '../components/HeroSection';
import { AdaptiveUploadCard } from '../components/AdaptiveUploadCard';
import { SampleLibrary } from '../components/SampleLibrary';
import { PredictionCard } from '../components/PredictionCard';
import { CategoryScale } from '../components/CategoryScale';
import { TrackPredictionSection } from '../components/TrackPredictionSection';
import { HistorySection } from '../components/HistorySection';
import { ModelStatsTable } from '../components/ModelStatsTable';
import { AdvisoryNote } from '../components/AdvisoryNote';
import { ErrorAlert } from '../components/ErrorAlert';
import { DestructionAlertModal } from '../components/DestructionAlertModal';
import { TargetCursor } from '../components/effects/TargetCursor';
import { OceanBackground } from '../components/effects/OceanBackground';
import { apiService, type SampleImageItem } from '../services/api';
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
  const [irImage, setIrImage] = useState<UploadedImageFile | null>(null);
  const [wvImage, setWvImage] = useState<UploadedImageFile | null>(null);
  const [visImage, setVisImage] = useState<UploadedImageFile | null>(null);
  const [pmwImage, setPmwImage] = useState<UploadedImageFile | null>(null);

  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [alertEmail, setAlertEmail] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDestructionAlertOpen, setIsDestructionAlertOpen] = useState<boolean>(false);

  const attachedSlots = [
    irImage ? { channel: 'IR' as SatelliteChannel, image: irImage } : null,
    wvImage ? { channel: 'WV' as SatelliteChannel, image: wvImage } : null,
    visImage ? { channel: 'VIS' as SatelliteChannel, image: visImage } : null,
    pmwImage ? { channel: 'PMW' as SatelliteChannel, image: pmwImage } : null,
  ].filter(Boolean) as { channel: SatelliteChannel; image: UploadedImageFile }[];

  const hasAnyImage = attachedSlots.length > 0;

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

  const handleSlotChange = (channel: SatelliteChannel, img: UploadedImageFile | null) => {
    if (channel === 'IR') setIrImage(img);
    else if (channel === 'WV') setWvImage(img);
    else if (channel === 'VIS') setVisImage(img);
    else if (channel === 'PMW') setPmwImage(img);

    if (img) {
      setSelectedChannel(channel);
    }
    setError(null);
  };

  const handleClearAllSlots = () => {
    setIrImage(null);
    setWvImage(null);
    setVisImage(null);
    setPmwImage(null);
    setError(null);
  };

  const handleSelectSample = (
    sampleIr: UploadedImageFile,
    sampleWv: UploadedImageFile | null,
    _sample: SampleImageItem,
    previewChannel?: SatelliteChannel
  ) => {
    setSelectedChannel(previewChannel || 'IR');
    setIrImage(sampleIr);
    setWvImage(sampleWv);
    setVisImage(null);
    setPmwImage(null);
    setError(null);
  };

  const scrollToTrackSection = () => {
    const trackEl = document.getElementById('track-section');
    if (trackEl) {
      trackEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleRunAnalysis = async () => {
    if (!hasAnyImage) {
      setError('Please upload at least one satellite image (IR, WV, VIS, or PMW) or select a sample preset.');
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
        irImage,
        wvImage,
        visImage,
        pmwImage,
        email: alertEmail.trim() || undefined,
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
            <div className={`px-2.5 py-1 rounded-md border text-[11px] font-mono text-slate-300 self-start sm:self-auto transition-colors duration-700 ${currentTheme.statusPillBg} ${currentTheme.statusPillBorder} flex items-center space-x-2`}>
              <span>Active Mode: <strong style={{ color: currentTheme.accentColor }}>{selectedChannel}</strong></span>
              <span className="text-slate-600">|</span>
              <span>Attached: <strong className="text-white">{attachedSlots.length}/4</strong></span>
            </div>
          </div>

          {/* Sample Satellite Imagery Library */}
          <SampleLibrary
            activeChannel={selectedChannel}
            onSelectSample={handleSelectSample}
          />

          {/* Four Simultaneous Multi-Spectral Upload Slots (IR, WV, VIS, PMW) */}
          <AdaptiveUploadCard
            irImage={irImage}
            wvImage={wvImage}
            visImage={visImage}
            pmwImage={pmwImage}
            onSlotChange={handleSlotChange}
            onError={(msg) => setError(msg)}
            onClearAll={handleClearAllSlots}
          />

          {/* Instrument Action Control Bar */}
          <div className="p-5 rounded-2xl bg-[#03070E]/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-2xl shadow-2xl">
            <div className="text-xs text-slate-300">
              <span className="font-semibold text-white block">Ready for Analysis Pipeline</span>
              {hasAnyImage ? (
                <span className="text-slate-400 font-mono">
                  Multi-Spectral Input:{' '}
                  <strong className="text-cyan-400 font-bold">
                    {attachedSlots.map((s) => s.channel).join(' + ')}
                  </strong>{' '}
                  ({attachedSlots.length} band{attachedSlots.length > 1 ? 's' : ''} registered: {attachedSlots.map((s) => s.image.name).join(', ')})
                </span>
              ) : (
                <span className="text-slate-400 font-mono">
                  Attach at least one satellite image (IR, WV, VIS, or PMW) or select a sample preset above
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-72">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  placeholder="Email for high-severity alerts (optional)"
                  className={`w-full pl-9 pr-3 py-3 rounded-xl bg-slate-950/80 border text-xs text-white placeholder-slate-500 focus:outline-none transition-colors font-mono ${
                    alertEmail.trim().length > 0 && !alertEmail.includes('@')
                      ? 'border-amber-500/80 focus:border-amber-400 focus:ring-1 focus:ring-amber-500/30'
                      : 'border-slate-800 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/30'
                  }`}
                />
              </div>

              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={!hasAnyImage || status === 'analyzing' || (alertEmail.trim().length > 0 && !alertEmail.includes('@'))}
                className={`w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-xs font-mono uppercase tracking-wider transition-all duration-300 shadow-xl flex items-center justify-center space-x-2 shrink-0 cursor-pointer select-none active:scale-95 ${
                  !hasAnyImage || status === 'analyzing' || (alertEmail.trim().length > 0 && !alertEmail.includes('@'))
                    ? 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
                    : currentTheme.primaryBtn
                }`}
              >
                {status === 'analyzing' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-current" />
                    <span>Processing Analysis ({attachedSlots.map((s) => s.channel).join(' + ')})...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-current" />
                    <span>
                      Run Cyclone Analysis {attachedSlots.length > 0 ? `(${attachedSlots.map((s) => s.channel).join(' + ')})` : ''}
                    </span>
                  </>
                )}
              </button>
            </div>
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

        {/* 8. Model Performance & Validation Benchmark */}
        <section id="model-stats-section" className="space-y-4">
          <div className={`border-b pb-3 transition-colors duration-700 ${currentTheme.sectionDivider}`}>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Model Performance & Validation
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Transparent evaluation benchmarks from the latest multi-spectral intensity and trajectory track forecast models
            </p>
          </div>

          <ModelStatsTable />
        </section>

      </main>

      {/* 9. Advisory Disclaimer Footer */}
      <AdvisoryNote activeChannel={selectedChannel} />
    </div>
  );
};
