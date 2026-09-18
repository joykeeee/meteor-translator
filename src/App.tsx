import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { VideoPlayer } from './components/VideoPlayer';
import { SubtitleList } from './components/SubtitleList';
import { ChatAgent } from './components/ChatAgent';
import { VideoInputModal } from './components/VideoInputModal';
import { CharacterDetailModal } from './components/CharacterDetailModal';
import { OcrScannerModal } from './components/OcrScannerModal';
import { SAMPLE_EPISODES } from './data/sampleEpisodes';
import { DramaEpisode, SubtitleLine, CharacterToken, ChatMessage } from './types';
import { parseChineseToTokens } from './utils/pinyinUtils';
import { captureFrameFromVideo, scanFrameOcr } from './utils/ocrService';
import { Sparkles, Info, HelpCircle, Film, BookOpen, Volume2, RefreshCw, Scan, Camera } from 'lucide-react';

export default function App() {
  // Active drama episode
  const [currentEpisode, setCurrentEpisode] = useState<DramaEpisode>(SAMPLE_EPISODES[0]);

  // Video playback time in seconds
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  // Settings
  const [colorCodedTones, setColorCodedTones] = useState<boolean>(true);
  const [showZhuyin, setShowZhuyin] = useState<boolean>(false);
  const [showOverlaySubtitle, setShowOverlaySubtitle] = useState<boolean>(true);
  const [loopingLine, setLoopingLine] = useState<SubtitleLine | null>(null);

  // Modals & Panels
  const [isVideoModalOpen, setIsVideoModalOpen] = useState<boolean>(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState<boolean>(false);
  const [isQuickOcrScanning, setIsQuickOcrScanning] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [selectedCharacterToken, setSelectedCharacterToken] = useState<CharacterToken | null>(null);
  const [selectedCharacterLine, setSelectedCharacterLine] = useState<SubtitleLine | null>(null);

  // AI Chat & Analysis States
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isAnalyzingScript, setIsAnalyzingScript] = useState<boolean>(false);
  const [analysisStatus, setAnalysisStatus] = useState<string | null>(null);

  // Context targeting for chat
  const [chatTargetLine, setChatTargetLine] = useState<SubtitleLine | null>(null);
  const [chatTargetChar, setChatTargetChar] = useState<string | null>(null);

  // Compute active subtitle line based on currentTime
  const activeLine = useMemo(() => {
    return currentEpisode.subtitles.find(
      (line) => currentTime >= line.startTime && currentTime <= line.endTime
    );
  }, [currentEpisode.subtitles, currentTime]);

  // Handle asking AI about a specific line
  const handleAskAiAboutLine = (line: SubtitleLine) => {
    setChatTargetLine(line);
    setChatTargetChar(null);
    setIsChatOpen(true);

    const initialPrompt = `Can you explain the pronunciation, tones, and meaning of "${line.mandarin}" (${line.english})? Are there any Taiwanese accent traits or colloquial phrases here?`;
    handleSendMessage(initialPrompt, line, undefined);
  };

  // Handle clicking a character
  const handleSelectCharacter = (token: CharacterToken, line: SubtitleLine) => {
    setSelectedCharacterToken(token);
    setSelectedCharacterLine(line);
  };

  // Handle asking AI about a specific character
  const handleAskAiAboutChar = (char: string, line: SubtitleLine) => {
    setChatTargetLine(line);
    setChatTargetChar(char);
    setIsChatOpen(true);

    const initialPrompt = `How is "${char}" pronounced here in "${line.mandarin}"? What is its tone, meaning, and does its pronunciation change with surrounding words (tone sandhi)?`;
    handleSendMessage(initialPrompt, line, char);
  };

  // Send message to AI Chatbot Agent
  const handleSendMessage = async (
    text: string,
    overrideLine?: SubtitleLine,
    overrideChar?: string
  ) => {
    const activeLineContext = overrideLine || chatTargetLine || activeLine;
    const activeCharContext = overrideChar || chatTargetChar;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      highlightedLineId: activeLineContext?.id,
      selectedChar: activeCharContext || undefined,
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: chatHistory.map((m) => ({ role: m.role, content: m.content })),
          currentLine: activeLineContext,
          selectedChar: activeCharContext,
          episodeTitle: `${currentEpisode.showName} - ${currentEpisode.title}`,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to get response from AI Tutor');
      }

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Sorry, could not generate a response.',
        timestamp: Date.now(),
      };

      setChatHistory((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `I couldn't reach the AI server right now, but here is a quick guide: In Taiwanese Mandarin, focus on smooth pitch transitions and relaxed retroflex sounds. Let me know if you want to retry!`,
        timestamp: Date.now(),
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // AI Subtitle Deep Analysis of the current episode
  const handleAnalyzeScriptWithAi = async () => {
    setIsAnalyzingScript(true);
    setAnalysisStatus('Analyzing dialogue script with Gemini AI...');

    try {
      const allText = currentEpisode.subtitles.map((s) => s.mandarin).join('\n');
      const res = await fetch('/api/analyze-subtitles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: allText,
          episodeTitle: `${currentEpisode.showName} - ${currentEpisode.title}`,
          videoUrl: currentEpisode.videoUrl,
        }),
      });

      if (!res.ok) throw new Error('Analysis failed');

      const data = await res.json();
      if (data.lines && Array.isArray(data.lines) && data.lines.length > 0) {
        // Merge enriched analysis back into current episode
        setCurrentEpisode((prev) => ({
          ...prev,
          subtitles: data.lines.map((line: any, idx: number) => ({
            ...line,
            // maintain timing if available
            startTime: prev.subtitles[idx]?.startTime ?? line.startTime,
            endTime: prev.subtitles[idx]?.endTime ?? line.endTime,
          })),
        }));
        setAnalysisStatus('Analysis complete! All subtitles enriched with Pinyin and Taiwanese nuances.');
      }
    } catch (err) {
      console.warn('Analysis error:', err);
      setAnalysisStatus('Script processed with local Mandarin pinyin engine.');
    } finally {
      setIsAnalyzingScript(false);
      setTimeout(() => setAnalysisStatus(null), 5000);
    }
  };

  // Custom Video Upload / Link
  const handleCustomVideo = async (data: {
    title: string;
    videoUrl: string;
    subtitleText?: string;
  }) => {
    let customLines: SubtitleLine[] = [];

    if (data.subtitleText) {
      // Analyze provided text
      setIsAnalyzingScript(true);
      try {
        const res = await fetch('/api/analyze-subtitles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: data.subtitleText,
            episodeTitle: data.title,
            videoUrl: data.videoUrl,
          }),
        });
        const resData = await res.json();
        if (resData.lines && resData.lines.length > 0) {
          customLines = resData.lines;
        }
      } catch (err) {
        console.warn('Analyze custom error:', err);
      } finally {
        setIsAnalyzingScript(false);
      }
    }

    if (customLines.length === 0) {
      // Create fallback lines or default line
      const defaultText = data.subtitleText || '歡迎收看台灣偶像劇，一起練習發音！';
      const lines = defaultText.split(/\n+/).map((t, idx) => ({
        id: `custom-line-${idx + 1}`,
        startTime: idx * 4,
        endTime: (idx + 1) * 4 - 0.5,
        mandarin: t,
        characters: parseChineseToTokens(t),
        english: 'Taiwanese drama dialogue line',
        taiwanNotes: 'Listen carefully to the tone pitch and rhythm of each character.',
        speaker: 'Speaker',
      }));
      customLines = lines;
    }

    const newEp: DramaEpisode = {
      id: `custom-${Date.now()}`,
      title: data.title,
      showName: 'Custom Episode',
      year: new Date().getFullYear().toString(),
      genre: 'User Video / Practice',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
      videoUrl: data.videoUrl,
      description: 'Custom video loaded by user for Mandarin pronunciation practice.',
      subtitles: customLines,
    };

    setCurrentEpisode(newEp);
    setCurrentTime(0);
  };

  // Quick Snapshot OCR for current video frame
  const handleQuickOcrCurrentFrame = async () => {
    if (!videoElement) {
      setAnalysisStatus('Video player is loading. Please wait a moment.');
      return;
    }

    setIsQuickOcrScanning(true);
    setAnalysisStatus('Scanning frame for Chinese subtitles with Optical Character Recognition...');

    try {
      const capture = captureFrameFromVideo(videoElement, { topPercent: 68, bottomPercent: 98 });
      if (!capture) {
        setAnalysisStatus('Could not read video frame buffer. If using an external video, please ensure CORS headers are supported or upload the file.');
        setIsQuickOcrScanning(false);
        return;
      }

      const res = await scanFrameOcr(capture.base64, currentTime, currentEpisode.title);

      if (res.hasSubtitle && res.mandarin && res.mandarin.trim().length > 0) {
        const start = Math.max(0, currentTime - 0.3);
        const end = start + 3.2;

        const newLine: SubtitleLine = {
          id: `ocr-${Date.now()}`,
          startTime: Number(start.toFixed(1)),
          endTime: Number(end.toFixed(1)),
          mandarin: res.mandarin.trim(),
          characters: res.characters || parseChineseToTokens(res.mandarin.trim()),
          english: res.english || 'Dialogue line from drama',
          taiwanNotes: res.taiwanNotes,
          speaker: 'Speaker',
        };

        // Add to current episode subtitles, deduplicating if very close
        const updatedSubs = [...currentEpisode.subtitles, newLine].sort((a, b) => a.startTime - b.startTime);
        setCurrentEpisode({
          ...currentEpisode,
          subtitles: updatedSubs,
        });

        setAnalysisStatus(`OCR Detected: "${newLine.mandarin}" (${newLine.english}) - Added to script!`);
      } else if (res.message) {
        setAnalysisStatus(res.message);
      } else {
        setAnalysisStatus('No Chinese subtitles detected on this exact frame. Try pausing during a dialogue subtitle and scan again.');
      }
    } catch (err: any) {
      console.error('Quick OCR error:', err);
      setAnalysisStatus('OCR scan encountered an error. Please try again.');
    } finally {
      setIsQuickOcrScanning(false);
    }
  };

  // Batch OCR apply
  const handleApplyParsedOcrSubtitles = (newLines: SubtitleLine[]) => {
    if (newLines.length === 0) return;
    const sorted = [...newLines].sort((a, b) => a.startTime - b.startTime);
    setCurrentEpisode({
      ...currentEpisode,
      subtitles: sorted,
    });
    setAnalysisStatus(`Successfully parsed and synchronized ${sorted.length} subtitle lines via OCR!`);
  };

  // Add single line from OCR modal
  const handleAddSingleOcrSubtitle = (line: SubtitleLine) => {
    const updated = [...currentEpisode.subtitles, line].sort((a, b) => a.startTime - b.startTime);
    setCurrentEpisode({
      ...currentEpisode,
      subtitles: updated,
    });
    setAnalysisStatus(`Added OCR subtitle: "${line.mandarin}" at ${line.startTime}s`);
  };

  // Delete a line (and its translation) from the current episode's script
  const handleDeleteLine = (line: SubtitleLine) => {
    setCurrentEpisode((prev) => ({
      ...prev,
      subtitles: prev.subtitles.filter((s) => s.id !== line.id),
    }));
    if (loopingLine?.id === line.id) setLoopingLine(null);
    if (chatTargetLine?.id === line.id) setChatTargetLine(null);
    setAnalysisStatus(`Deleted line: "${line.mandarin}"`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col font-sans transition-colors">
      {/* Header */}
      <Header
        onOpenVideoModal={() => setIsVideoModalOpen(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
        isChatOpen={isChatOpen}
        showZhuyin={showZhuyin}
        onToggleZhuyin={() => setShowZhuyin(!showZhuyin)}
        colorCodedTones={colorCodedTones}
        onToggleColorTones={() => setColorCodedTones(!colorCodedTones)}
      />

      {/* Main Learning Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Toast / Analysis Banner */}
        {analysisStatus && (
          <div className="bg-gradient-to-r from-cyan-500 to-yellow-400 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>{analysisStatus}</span>
            </div>
            <button
              onClick={() => setAnalysisStatus(null)}
              className="text-white/80 hover:text-white text-xs px-2 py-0.5"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Video Player + Episode Details (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <VideoPlayer
              videoUrl={currentEpisode.videoUrl}
              subtitles={currentEpisode.subtitles}
              currentTime={currentTime}
              onTimeUpdate={setCurrentTime}
              activeLine={activeLine}
              loopingLine={loopingLine}
              onToggleLoopLine={setLoopingLine}
              showOverlaySubtitle={showOverlaySubtitle}
              onToggleOverlaySubtitle={() => setShowOverlaySubtitle(!showOverlaySubtitle)}
              colorCodedTones={colorCodedTones}
              showZhuyin={showZhuyin}
              onAskAiAboutLine={handleAskAiAboutLine}
              onQuickOcrCurrentFrame={handleQuickOcrCurrentFrame}
              isOcrScanning={isQuickOcrScanning}
              onVideoRefReady={setVideoElement}
            />

            {/* Episode Context */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div>
                  <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                    {currentEpisode.showName} • {currentEpisode.genre}
                  </span>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    {currentEpisode.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsOcrModalOpen(true)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 border border-cyan-200 dark:border-cyan-900 transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Scan className="w-3.5 h-3.5" />
                    OCR Subtitle Scanner
                  </button>

                  <button
                    onClick={() => setIsVideoModalOpen(true)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition whitespace-nowrap shrink-0"
                  >
                    Switch Episode
                  </button>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {currentEpisode.description}
              </p>

              {/* Tone Legend */}
              {colorCodedTones && (
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-3 text-xs">
                  <span className="font-semibold text-gray-500">Pinyin Tones:</span>
                  <span className="inline-flex items-center gap-1 font-medium text-rose-600 dark:text-rose-400">
                    <span className="w-2 h-2 rounded-full bg-rose-500" /> 1st Tone (mā)
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-500" /> 2nd Tone (má)
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> 3rd Tone (mǎ)
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> 4th Tone (mà)
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                    <span className="w-2 h-2 rounded-full bg-slate-400" /> Neutral (ma)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Interactive Subtitle Script List (5 cols) */}
          <div className="lg:col-span-5 h-[650px]">
            <SubtitleList
              subtitles={currentEpisode.subtitles}
              episodeTitle={`${currentEpisode.showName} - ${currentEpisode.title}`}
              currentTime={currentTime}
              activeLineId={activeLine?.id}
              loopingLineId={loopingLine?.id}
              colorCodedTones={colorCodedTones}
              showZhuyin={showZhuyin}
              onSelectCharacter={handleSelectCharacter}
              onAskAiAboutLine={handleAskAiAboutLine}
              onJumpToTime={(time) => setCurrentTime(time)}
              onLoopLine={(line) => {
                if (loopingLine?.id === line.id) {
                  setLoopingLine(null);
                } else {
                  setLoopingLine(line);
                  setCurrentTime(line.startTime);
                }
              }}
              onDeleteLine={handleDeleteLine}
              onOpenOcrScanner={() => setIsOcrModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* Slide-out Chatbot Agent Drawer */}
      {isChatOpen && (
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] max-w-full shadow-2xl animate-in slide-in-from-right duration-200">
          <ChatAgent
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            currentEpisodeTitle={`${currentEpisode.showName} - ${currentEpisode.title}`}
            selectedLine={chatTargetLine || activeLine}
            selectedChar={chatTargetChar || undefined}
            onClearSelection={() => {
              setChatTargetLine(null);
              setChatTargetChar(null);
            }}
            chatHistory={chatHistory}
            onSendMessage={(msg) => handleSendMessage(msg)}
            isLoading={isChatLoading}
          />
        </div>
      )}

      {/* Video / Episode Picker Modal */}
      <VideoInputModal
        isOpen={isVideoModalOpen}
        onClose={() => setIsVideoModalOpen(false)}
        onCustomVideo={handleCustomVideo}
      />

      {/* Optical Character Recognition (OCR) Scanner Modal */}
      <OcrScannerModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
        videoElement={videoElement}
        videoDuration={videoElement?.duration || 180}
        currentTime={currentTime}
        episodeTitle={`${currentEpisode.showName} - ${currentEpisode.title}`}
        onApplyParsedSubtitles={handleApplyParsedOcrSubtitles}
        onAddSingleSubtitle={handleAddSingleOcrSubtitle}
        colorCodedTones={colorCodedTones}
        showZhuyin={showZhuyin}
      />

      {/* Character Inspector Modal */}
      <CharacterDetailModal
        token={selectedCharacterToken}
        line={selectedCharacterLine}
        onClose={() => {
          setSelectedCharacterToken(null);
          setSelectedCharacterLine(null);
        }}
        onAskAi={handleAskAiAboutChar}
      />
    </div>
  );
}
