import React, { useState, useRef, useEffect } from 'react';
import {
  Scan,
  Camera,
  Sparkles,
  Play,
  Pause,
  Square,
  Check,
  X,
  SlidersHorizontal,
  Upload,
  Layers,
  RefreshCw,
  AlertCircle,
  Eye,
  Plus,
} from 'lucide-react';
import { SubtitleLine, OcrResult } from '../types';
import { captureFrameFromVideo, scanFrameOcr, CropRegion } from '../utils/ocrService';
import { SubtitleRubyLine } from './SubtitleRubyLine';

interface OcrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoElement: HTMLVideoElement | null;
  videoDuration: number;
  currentTime: number;
  episodeTitle: string;
  onApplyParsedSubtitles: (newLines: SubtitleLine[]) => void;
  onAddSingleSubtitle: (line: SubtitleLine) => void;
  colorCodedTones: boolean;
  showZhuyin: boolean;
}

export const OcrScannerModal: React.FC<OcrScannerModalProps> = ({
  isOpen,
  onClose,
  videoElement,
  videoDuration,
  currentTime,
  episodeTitle,
  onApplyParsedSubtitles,
  onAddSingleSubtitle,
  colorCodedTones,
  showZhuyin,
}) => {
  const [mode, setMode] = useState<'single' | 'batch' | 'upload'>('single');

  // Crop configuration
  const [cropRegion, setCropRegion] = useState<CropRegion>({
    topPercent: 68,
    bottomPercent: 96,
  });

  // Single Frame OCR states
  const [isSingleScanning, setIsSingleScanning] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [singleResult, setSingleResult] = useState<OcrResult | null>(null);

  // Batch OCR states
  const [isBatchScanning, setIsBatchScanning] = useState(false);
  const [batchProgressTime, setBatchProgressTime] = useState<number>(0);
  const [batchStartTime, setBatchStartTime] = useState<number>(0);
  const [batchEndTime, setBatchEndTime] = useState<number>(Math.min(videoDuration || 180, 180));
  const [scanInterval, setScanInterval] = useState<number>(2.5); // seconds
  const [detectedBatchLines, setDetectedBatchLines] = useState<SubtitleLine[]>([]);
  const [currentBatchPreview, setCurrentBatchPreview] = useState<string | null>(null);
  const [currentBatchStatus, setCurrentBatchStatus] = useState<string>('');

  const cancelBatchRef = useRef<boolean>(false);

  // Capture current video frame when modal opens or single scan tab is selected
  useEffect(() => {
    if (isOpen && videoElement && mode === 'single' && !capturedPreview) {
      handleCaptureCurrentFrame();
    }
    if (videoDuration && batchEndTime === 0) {
      setBatchEndTime(Math.min(videoDuration, 180));
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleCaptureCurrentFrame = () => {
    if (!videoElement) return;
    const capture = captureFrameFromVideo(videoElement, cropRegion);
    if (capture) {
      setCapturedPreview(capture.dataUrl);
      setSingleResult(null);
    }
  };

  const handleRunSingleOcr = async () => {
    if (!videoElement) return;
    setIsSingleScanning(true);
    try {
      const capture = captureFrameFromVideo(videoElement, cropRegion);
      if (!capture) {
        setIsSingleScanning(false);
        return;
      }
      setCapturedPreview(capture.dataUrl);

      const result = await scanFrameOcr(
        capture.base64,
        videoElement.currentTime,
        episodeTitle
      );
      setSingleResult(result);
    } catch (err) {
      console.error('Single scan failed:', err);
    } finally {
      setIsSingleScanning(false);
    }
  };

  const handleAddSingleResultToScript = () => {
    if (!singleResult || !singleResult.mandarin || !videoElement) return;

    const start = Math.max(0, videoElement.currentTime - 0.5);
    const end = start + 3.5;

    const newLine: SubtitleLine = {
      id: `ocr-${Date.now()}`,
      startTime: Number(start.toFixed(1)),
      endTime: Number(end.toFixed(1)),
      mandarin: singleResult.mandarin,
      english: singleResult.english || 'Drama dialogue line',
      taiwanNotes: singleResult.taiwanNotes,
      characters: singleResult.characters || [],
      speaker: 'Speaker',
    };

    onAddSingleSubtitle(newLine);
    onClose();
  };

  // Upload image handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedPreview(dataUrl);
      setIsSingleScanning(true);
      try {
        const base64 = dataUrl.replace(/^data:image\/[a-zA-Z0-9.-]+;base64,/, '');
        const result = await scanFrameOcr(base64, currentTime, episodeTitle);
        setSingleResult(result);
      } catch (err) {
        console.error('Image scan failed:', err);
      } finally {
        setIsSingleScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Automated Batch OCR Scanner through video timeline
  const handleStartBatchScan = async () => {
    if (!videoElement) return;

    setIsBatchScanning(true);
    cancelBatchRef.current = false;
    setDetectedBatchLines([]);
    setCurrentBatchStatus('Initializing automated frame optical character recognition...');

    const startSec = Math.max(0, batchStartTime);
    const endSec = Math.min(videoDuration || 300, batchEndTime > startSec ? batchEndTime : startSec + 60);

    const accumulatedLines: SubtitleLine[] = [];
    let lastSeenText = '';
    let lastActiveLine: SubtitleLine | null = null;

    try {
      videoElement.pause();

      for (let t = startSec; t <= endSec; t += scanInterval) {
        if (cancelBatchRef.current) {
          setCurrentBatchStatus('Scan cancelled by user.');
          break;
        }

        setBatchProgressTime(t);
        setCurrentBatchStatus(`Scanning frame at ${Math.floor(t / 60)}:${(t % 60).toFixed(0).padStart(2, '0')}...`);

        // Seek video to timestamp
        videoElement.currentTime = t;

        // Wait for frame render
        await new Promise<void>((resolve) => {
          const onSeeked = () => {
            videoElement.removeEventListener('seeked', onSeeked);
            resolve();
          };
          videoElement.addEventListener('seeked', onSeeked);
          // Safety timeout
          setTimeout(() => {
            videoElement.removeEventListener('seeked', onSeeked);
            resolve();
          }, 450);
        });

        // Capture frame
        const capture = captureFrameFromVideo(videoElement, cropRegion);
        if (!capture) continue;

        setCurrentBatchPreview(capture.dataUrl);

        // Run OCR on this frame
        const res = await scanFrameOcr(capture.base64, t, episodeTitle);

        if (res.isUnavailable) {
          setCurrentBatchStatus('AI service busy with high demand spike. Retrying shortly...');
          await new Promise((r) => setTimeout(r, 1200));
        }

        if (res.hasSubtitle && res.mandarin && res.mandarin.trim().length > 0) {
          const cleanText = res.mandarin.trim();

          // If text is identical to previous frame, extend duration of previous subtitle
          if (cleanText === lastSeenText && lastActiveLine) {
            lastActiveLine.endTime = Number((t + scanInterval).toFixed(1));
            setDetectedBatchLines([...accumulatedLines]);
          } else {
            // New subtitle detected!
            lastSeenText = cleanText;
            const newLine: SubtitleLine = {
              id: `ocr-${Date.now()}-${accumulatedLines.length}`,
              startTime: Number(t.toFixed(1)),
              endTime: Number((t + scanInterval).toFixed(1)),
              mandarin: cleanText,
              english: res.english || 'Dialogue subtitle',
              taiwanNotes: res.taiwanNotes,
              characters: res.characters || [],
              speaker: 'Speaker',
            };

            lastActiveLine = newLine;
            accumulatedLines.push(newLine);
            setDetectedBatchLines([...accumulatedLines]);
          }
        } else {
          // Frame has no subtitle
          lastSeenText = '';
          lastActiveLine = null;
        }
      }

      setCurrentBatchStatus(`Completed scan! Found ${accumulatedLines.length} subtitle lines.`);
    } catch (err) {
      console.error('Batch scan error:', err);
      setCurrentBatchStatus('Error occurred during scanning.');
    } finally {
      setIsBatchScanning(false);
    }
  };

  const handleStopBatchScan = () => {
    cancelBatchRef.current = true;
    setIsBatchScanning(false);
  };

  const handleApplyBatchResults = () => {
    if (detectedBatchLines.length === 0) return;
    onApplyParsedSubtitles(detectedBatchLines);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white flex items-center gap-2">
                Optical Character Recognition (OCR) Subtitle Parser
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Extract subtitles directly from frames
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 px-5 pt-3 gap-4 text-xs sm:text-sm font-medium">
          <button
            onClick={() => setMode('single')}
            className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${
              mode === 'single'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Camera className="w-4 h-4" />
            Scan Current Frame
          </button>

          <button
            onClick={() => setMode('batch')}
            className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${
              mode === 'batch'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Auto-Scan Video Timeline
          </button>

          <button
            onClick={() => setMode('upload')}
            className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${
              mode === 'upload'
                ? 'border-cyan-600 text-cyan-600 dark:text-cyan-400 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Upload Frame Screenshot
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Subtitle Zone Crop Region Adjuster */}
          <div className="bg-gray-50 dark:bg-gray-800/60 p-3 rounded-xl border border-gray-200 dark:border-gray-700/80">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <span className="flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-500" />
                Subtitle Detection Zone:
              </span>
              <span className="font-mono text-[11px] text-gray-500">
                Top {cropRegion.topPercent}% to {cropRegion.bottomPercent}% of frame
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCropRegion({ topPercent: 70, bottomPercent: 98 })}
                className={`py-1 px-2 rounded-lg text-xs font-medium border transition ${
                  cropRegion.topPercent === 70
                    ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-400 text-cyan-600 dark:text-cyan-400'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                Standard Lower Bar (Bottom 30%)
              </button>
              <button
                type="button"
                onClick={() => setCropRegion({ topPercent: 60, bottomPercent: 98 })}
                className={`py-1 px-2 rounded-lg text-xs font-medium border transition ${
                  cropRegion.topPercent === 60
                    ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-400 text-cyan-600 dark:text-cyan-400'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                Taller Subtitle Bar (Bottom 40%)
              </button>
              <button
                type="button"
                onClick={() => setCropRegion({ topPercent: 10, bottomPercent: 98 })}
                className={`py-1 px-2 rounded-lg text-xs font-medium border transition ${
                  cropRegion.topPercent === 10
                    ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-400 text-cyan-600 dark:text-cyan-400'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                Full Screen Frame (All Text)
              </button>
            </div>
          </div>

          {/* TAB 1: Single Frame OCR */}
          {mode === 'single' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Scan Frame at Current Video Timestamp ({Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')})
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Snapshots the video frame subtitle bar and runs Gemini vision OCR to transcribe the dialogue.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCaptureCurrentFrame}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh Frame
                  </button>
                  <button
                    onClick={handleRunSingleOcr}
                    disabled={isSingleScanning}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isSingleScanning ? 'animate-spin' : ''}`} />
                    <span>{isSingleScanning ? 'Extracting Subtitles...' : 'Run OCR Scan'}</span>
                  </button>
                </div>
              </div>

              {/* Frame Capture Preview */}
              {capturedPreview && (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black flex flex-col items-center">
                  <div className="w-full bg-gray-950 px-3 py-1 text-[11px] text-gray-400 flex items-center justify-between">
                    <span>Cropped Subtitle Detection Area</span>
                    <span>Ready for OCR</span>
                  </div>
                  <img
                    src={capturedPreview}
                    alt="Captured video subtitle frame"
                    className="max-h-48 w-full object-contain bg-gray-950"
                  />
                </div>
              )}

              {/* Result Preview */}
              {singleResult && (
                <div className="p-4 rounded-xl border border-cyan-200 dark:border-cyan-900/60 bg-cyan-50/40 dark:bg-cyan-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-500" />
                      OCR Subtitle Result
                    </span>
                    {singleResult.hasSubtitle && (
                      <button
                        onClick={handleAddSingleResultToScript}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Line to Episode Script
                      </button>
                    )}
                  </div>

                  {singleResult.hasSubtitle && singleResult.mandarin ? (
                    <div className="space-y-3">
                      <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                        <SubtitleRubyLine
                          line={{
                            id: 'temp-preview',
                            startTime: currentTime,
                            endTime: currentTime + 3,
                            mandarin: singleResult.mandarin,
                            english: singleResult.english || '',
                            taiwanNotes: singleResult.taiwanNotes,
                            characters: singleResult.characters || [],
                          }}
                          colorCodedTones={colorCodedTones}
                          showZhuyin={showZhuyin}
                          size="large"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 dark:text-gray-400 py-2">
                      {singleResult.message || 'No dialogue subtitles were detected in this particular frame. Try pausing during a spoken dialogue moment and scan again.'}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Automated Batch Scanner */}
          {mode === 'batch' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Automated Video Timeline OCR Scanner
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Scans through the video at regular intervals, detects on-screen subtitle changes, merges continuous lines, and generates the interactive script automatically.
                </p>
              </div>

              {/* Scan Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Start Time (Seconds):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={videoDuration}
                    value={batchStartTime}
                    onChange={(e) => setBatchStartTime(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    End Time (Seconds):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={videoDuration}
                    value={batchEndTime}
                    onChange={(e) => setBatchEndTime(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Sampling Interval:
                  </label>
                  <select
                    value={scanInterval}
                    onChange={(e) => setScanInterval(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value={1.5}>Every 1.5 seconds (High precision)</option>
                    <option value={2.5}>Every 2.5 seconds (Recommended)</option>
                    <option value={4}>Every 4 seconds (Fast scan)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                {!isBatchScanning ? (
                  <button
                    onClick={handleStartBatchScan}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-yellow-600 hover:from-cyan-700 hover:to-yellow-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Start Auto-Scanning Subtitles
                  </button>
                ) : (
                  <button
                    onClick={handleStopBatchScan}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-2"
                  >
                    <Square className="w-4 h-4 fill-current" />
                    Stop Scanning
                  </button>
                )}

                {detectedBatchLines.length > 0 && (
                  <button
                    onClick={handleApplyBatchResults}
                    disabled={isBatchScanning}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition flex items-center gap-2 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Apply {detectedBatchLines.length} Lines to Episode
                  </button>
                )}
              </div>

              {/* Status & Progress */}
              {currentBatchStatus && (
                <div className="p-3 rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {currentBatchStatus}
                    </span>
                    <span className="font-mono text-gray-500">
                      {Math.floor(batchProgressTime / 60)}:{(batchProgressTime % 60).toFixed(0).padStart(2, '0')} /{' '}
                      {Math.floor(batchEndTime / 60)}:{(batchEndTime % 60).toFixed(0).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-cyan-600 h-full transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            ((batchProgressTime - batchStartTime) / (batchEndTime - batchStartTime || 1)) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Live Preview of detected lines */}
              {detectedBatchLines.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Detected Lines ({detectedBatchLines.length}):
                  </h5>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {detectedBatchLines.map((line, idx) => (
                      <div
                        key={line.id}
                        className="p-2.5 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-xs flex items-start justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">
                              {line.startTime}s - {line.endTime}s
                            </span>
                            <span className="font-bold text-gray-900 dark:text-white">
                              {line.mandarin}
                            </span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-[11px]">
                            {line.english}
                          </p>
                        </div>
                        <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                          OCR #{idx + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Screenshot Upload */}
          {mode === 'upload' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  Upload Video Screenshot / Frame Image
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select or drag in a screenshot with Mandarin subtitles to transcribe it with character pinyin and translation.
                </p>
              </div>

              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-6 text-center hover:border-cyan-400 transition cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="screenshot-file-input"
                />
                <label
                  htmlFor="screenshot-file-input"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-cyan-500" />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Click to select frame image or screenshot
                  </span>
                  <span className="text-[11px] text-gray-400">
                    Supports JPG, PNG, WebP screenshots with burned-in subtitles
                  </span>
                </label>
              </div>

              {capturedPreview && (
                <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black flex flex-col items-center">
                  <img
                    src={capturedPreview}
                    alt="Uploaded screenshot"
                    className="max-h-56 w-full object-contain"
                  />
                </div>
              )}

              {singleResult && singleResult.hasSubtitle && (
                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-500" />
                      Successfully Extracted from Screenshot!
                    </span>
                    <button
                      onClick={handleAddSingleResultToScript}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add to Current Script
                    </button>
                  </div>

                  <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-800">
                    <SubtitleRubyLine
                      line={{
                        id: 'screenshot-preview',
                        startTime: currentTime,
                        endTime: currentTime + 3,
                        mandarin: singleResult.mandarin || '',
                        english: singleResult.english || '',
                        taiwanNotes: singleResult.taiwanNotes,
                        characters: singleResult.characters || [],
                      }}
                      colorCodedTones={colorCodedTones}
                      showZhuyin={showZhuyin}
                      size="large"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
