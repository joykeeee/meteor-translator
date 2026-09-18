import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Maximize, FastForward, Repeat, Layers, Camera } from 'lucide-react';
import { SubtitleLine } from '../types';
import { SubtitleRubyLine } from './SubtitleRubyLine';

interface VideoPlayerProps {
  videoUrl: string;
  subtitles: SubtitleLine[];
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  activeLine?: SubtitleLine;
  loopingLine: SubtitleLine | null;
  onToggleLoopLine: (line: SubtitleLine | null) => void;
  showOverlaySubtitle: boolean;
  onToggleOverlaySubtitle: () => void;
  colorCodedTones: boolean;
  showZhuyin: boolean;
  onAskAiAboutLine: (line: SubtitleLine) => void;
  onQuickOcrCurrentFrame?: () => void;
  isOcrScanning?: boolean;
  onVideoRefReady?: (videoEl: HTMLVideoElement | null) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoUrl,
  subtitles,
  currentTime,
  onTimeUpdate,
  activeLine,
  loopingLine,
  onToggleLoopLine,
  showOverlaySubtitle,
  onToggleOverlaySubtitle,
  colorCodedTones,
  showZhuyin,
  onAskAiAboutLine,
  onQuickOcrCurrentFrame,
  isOcrScanning,
  onVideoRefReady,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (onVideoRefReady) {
      onVideoRefReady(videoRef.current);
    }
  }, [onVideoRefReady, videoUrl]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Sync external currentTime changes (like when clicking a subtitle line)
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - currentTime) > 0.5) {
      videoRef.current.currentTime = currentTime;
    }
  }, [currentTime]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(console.warn);
    }
  };

  // Handle line looping securely with locked line reference
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const now = videoRef.current.currentTime;

    if (loopingLine) {
      if (now >= loopingLine.endTime || now < loopingLine.startTime - 0.2) {
        videoRef.current.currentTime = loopingLine.startTime;
        onTimeUpdate(loopingLine.startTime);
        return;
      }
    }

    onTimeUpdate(now);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
      onTimeUpdate(targetTime);
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen().catch(console.warn);
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-2xl overflow-hidden shadow-lg border border-gray-800 flex flex-col group/player"
    >
      {/* Video Element */}
      <div className="relative aspect-video w-full bg-gray-950 flex items-center justify-center">
        <video
          ref={videoRef}
          src={videoUrl}
          crossOrigin="anonymous"
          playsInline
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* Loop Status Pill Banner */}
        {loopingLine && (
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between bg-cyan-950/85 backdrop-blur-md border border-cyan-500/50 text-white px-3 py-1.5 rounded-xl shadow-lg z-20 animate-in fade-in text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
              <span className="font-semibold text-cyan-300 shrink-0">Looping Sentence:</span>
              <span className="font-medium truncate">"{loopingLine.mandarin}"</span>
            </div>
            <button
              onClick={() => onToggleLoopLine(null)}
              className="ml-2 shrink-0 px-2 py-0.5 rounded bg-cyan-800/80 hover:bg-cyan-700 text-white text-[11px] font-semibold transition"
            >
              Exit Loop
            </button>
          </div>
        )}

        {/* Big play button overlay when paused */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-black/60 hover:bg-cyan-600/90 text-white flex items-center justify-center backdrop-blur-xs transition-transform transform hover:scale-110"
            title="Play Video"
          >
            <Play className="w-8 h-8 fill-current ml-1" />
          </button>
        )}

        {/* Video Subtitle Overlay (Exact Pinyin-Above, English-Below layout) */}
        {showOverlaySubtitle && activeLine && (
          <div className="absolute bottom-2 left-2 right-2 max-h-[25%] pointer-events-auto flex justify-center items-end">
            <div className="max-w-md w-full max-h-full overflow-hidden bg-gray-950/85 backdrop-blur-md rounded-lg p-1.5 border border-white/20 shadow-2xl">
              <SubtitleRubyLine
                line={activeLine}
                colorCodedTones={colorCodedTones}
                showZhuyin={showZhuyin}
                onAskAiAboutLine={onAskAiAboutLine}
                size="compact"
                hideTaiwanNotes
              />
            </div>
          </div>
        )}
      </div>

      {/* Control Bar */}
      <div className="bg-gray-900 px-4 py-3 border-t border-gray-800 flex flex-col gap-2 select-none">
        {/* Scrub Bar with Subtitle Cue Markers */}
        <div className="relative w-full flex items-center group/scrub">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:h-2 transition-all"
          />

          {/* Markers for subtitles */}
          {duration > 0 &&
            subtitles.map((line) => {
              const leftPercent = (line.startTime / duration) * 100;
              return (
                <div
                  key={line.id}
                  style={{ left: `${leftPercent}%` }}
                  title={`${line.mandarin} (${line.english})`}
                  className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-yellow-400/70 rounded-full pointer-events-none"
                />
              );
            })}
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between gap-4 text-xs text-gray-300">
          {/* Left: Play/Pause, Rewind, Time, Loop */}
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-1.5 hover:bg-gray-800 text-white rounded transition"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
                }
              }}
              className="p-1.5 hover:bg-gray-800 rounded transition text-gray-400 hover:text-white"
              title="Jump 5s back"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Time readout */}
            <span className="font-mono text-gray-400">
              {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')} /{' '}
              {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}
            </span>

            {/* Loop line button */}
            <button
              onClick={() => {
                if (loopingLine) {
                  onToggleLoopLine(null);
                } else if (activeLine) {
                  onToggleLoopLine(activeLine);
                } else if (subtitles.length > 0) {
                  // Find nearest line
                  const nearest = subtitles.find((s) => s.startTime >= currentTime) || subtitles[0];
                  onToggleLoopLine(nearest);
                }
              }}
              className={`flex items-center gap-1 px-2.5 py-1 rounded transition text-xs font-semibold ${
                loopingLine
                  ? 'bg-cyan-600 text-white ring-2 ring-cyan-400/40 shadow-xs'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title={
                loopingLine
                  ? `Looping "${loopingLine.mandarin}". Click to stop.`
                  : 'Loop current line continuously for pronunciation practice'
              }
            >
              <Repeat className={`w-3.5 h-3.5 ${loopingLine ? 'animate-spin' : ''}`} />
              <span>{loopingLine ? 'Looping Line (Active)' : 'Loop Line'}</span>
            </button>

            {/* OCR Frame Scanner Quick Action */}
            {onQuickOcrCurrentFrame && (
              <button
                onClick={onQuickOcrCurrentFrame}
                disabled={isOcrScanning}
                className="flex items-center gap-1 px-2.5 py-1 rounded transition text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-yellow-300 border border-yellow-500/30 hover:border-yellow-400/60 shadow-xs disabled:opacity-50"
                title="Use Optical Character Recognition to read burned-in Chinese subtitles from this exact frame"
              >
                <Camera className={`w-3.5 h-3.5 ${isOcrScanning ? 'animate-spin text-yellow-400' : ''}`} />
                <span>{isOcrScanning ? 'Scanning...' : 'OCR Current Frame'}</span>
              </button>
            )}
          </div>

          {/* Right: Subtitle Overlay toggle, Speed, Volume, Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Toggle in-video overlay */}
            <button
              onClick={onToggleOverlaySubtitle}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition ${
                showOverlaySubtitle
                  ? 'bg-gray-700 text-cyan-300 font-semibold'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title="Toggle Pinyin & Subtitle overlay on video screen"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Video Overlay</span>
            </button>

            {/* Playback speed selector */}
            <div className="flex items-center bg-gray-800 rounded p-0.5 font-mono text-[11px]">
              {[0.75, 1, 1.25].map((rate) => (
                <button
                  key={rate}
                  onClick={() => changePlaybackRate(rate)}
                  className={`px-1.5 py-0.5 rounded transition ${
                    playbackRate === rate ? 'bg-cyan-600 text-white font-bold' : 'text-gray-400 hover:text-white'
                  }`}
                  title={`${rate}x speed (slower speed is great for learning pronunciation)`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Volume toggle */}
            <button
              onClick={toggleMute}
              className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-gray-800 text-gray-400 hover:text-white rounded transition"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
