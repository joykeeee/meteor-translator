import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, BookOpen, Volume2, LocateFixed, Scan, Camera, Download, Highlighter, BookMarked, X } from 'lucide-react';
import { SubtitleLine, CharacterToken } from '../types';
import { SubtitleRubyLine } from './SubtitleRubyLine';
import { exportSubtitlesAsJson, exportSubtitlesAsSrt } from '../utils/exportUtils';

interface PhraseSelection {
  lineId: string;
  anchor: number;
  start: number;
  end: number;
}

interface SubtitleListProps {
  subtitles: SubtitleLine[];
  episodeTitle: string;
  currentTime: number;
  activeLineId?: string;
  loopingLineId?: string;
  colorCodedTones: boolean;
  showZhuyin: boolean;
  onSelectCharacter: (token: CharacterToken, line: SubtitleLine) => void;
  onAskAiAboutLine: (line: SubtitleLine) => void;
  onJumpToTime: (time: number) => void;
  onLoopLine?: (line: SubtitleLine) => void;
  onDeleteLine?: (line: SubtitleLine) => void;
  onOpenOcrScanner?: () => void;
  onSaveToVocabulary?: (params: { mandarin: string; pinyin: string; zhuyin: string; sourceEpisode: string }) => void;
}

export const SubtitleList: React.FC<SubtitleListProps> = ({
  subtitles,
  episodeTitle,
  activeLineId,
  loopingLineId,
  colorCodedTones,
  showZhuyin,
  onSelectCharacter,
  onAskAiAboutLine,
  onJumpToTime,
  onLoopLine,
  onDeleteLine,
  onOpenOcrScanner,
  onSaveToVocabulary,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [phraseSelectionMode, setPhraseSelectionMode] = useState(false);
  const [phraseSelection, setPhraseSelection] = useState<PhraseSelection | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const handleCharacterRangeClick = (index: number, line: SubtitleLine) => {
    setPhraseSelection((prev) => {
      if (!prev || prev.lineId !== line.id) {
        return { lineId: line.id, anchor: index, start: index, end: index };
      }
      return {
        lineId: line.id,
        anchor: prev.anchor,
        start: Math.min(prev.anchor, index),
        end: Math.max(prev.anchor, index),
      };
    });
  };

  const selectedPhrase = useMemo(() => {
    if (!phraseSelection) return null;
    const line = subtitles.find((s) => s.id === phraseSelection.lineId);
    if (!line) return null;
    const tokens = line.characters.slice(phraseSelection.start, phraseSelection.end + 1);
    const mandarin = tokens.map((t) => t.char).join('');
    const pinyin = tokens.filter((t) => t.pinyin).map((t) => t.pinyin).join(' ');
    const zhuyin = tokens.filter((t) => t.zhuyin).map((t) => t.zhuyin).join(' ');
    return { mandarin, pinyin, zhuyin };
  }, [phraseSelection, subtitles]);

  const handleSaveSelection = () => {
    if (!selectedPhrase || !selectedPhrase.mandarin || !onSaveToVocabulary) return;
    onSaveToVocabulary({ ...selectedPhrase, sourceEpisode: episodeTitle });
    setPhraseSelection(null);
  };

  // Close the export menu on an outside click
  useEffect(() => {
    if (!isExportMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExportMenuOpen]);

  // Auto-scroll to active subtitle line as video plays
  useEffect(() => {
    if (!autoScroll || !activeLineId || searchQuery.trim()) return;

    const targetElement = document.getElementById(`subtitle-${activeLineId}`);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeLineId, autoScroll, searchQuery]);

  // Filter subtitles based on search term
  const filteredSubtitles = useMemo(() => {
    if (!searchQuery.trim()) return subtitles;
    const q = searchQuery.toLowerCase().trim();
    return subtitles.filter(
      (sub) =>
        sub.mandarin.includes(q) ||
        sub.english.toLowerCase().includes(q) ||
        sub.characters.some((c) => c.pinyin.toLowerCase().includes(q)) ||
        (sub.taiwanNotes && sub.taiwanNotes.toLowerCase().includes(q))
    );
  }, [subtitles, searchQuery]);

  return (
    <div className="flex flex-col h-full">
      {/* Script Header Bar */}
      <div className="pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            <h2 className="font-bold text-base text-gray-900 dark:text-white">
              Episode Subtitle Script
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition border whitespace-nowrap shrink-0 ${
                autoScroll
                  ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900 font-semibold'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'
              }`}
              title="Automatically scroll the script to the currently spoken line"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Follow: {autoScroll ? 'ON' : 'OFF'}</span>
            </button>

            {onSaveToVocabulary && (
              <button
                onClick={() => {
                  setPhraseSelectionMode((v) => !v);
                  setPhraseSelection(null);
                }}
                className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg transition border whitespace-nowrap shrink-0 ${
                  phraseSelectionMode
                    ? 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-800 font-semibold'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'
                }`}
                title="Click a run of characters to select a word or phrase, then save it to your vocabulary list"
              >
                <Highlighter className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Select Phrase</span>
              </button>
            )}

            {onOpenOcrScanner && (
              <button
                onClick={onOpenOcrScanner}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition whitespace-nowrap shrink-0"
                title="Optical Character Recognition: extract burned-in subtitles from video frames"
              >
                <Scan className="w-3.5 h-3.5 text-cyan-500" />
                <span>OCR Scan</span>
              </button>
            )}

            <div className="relative" ref={exportMenuRef}>
              <button
                onClick={() => setIsExportMenuOpen((v) => !v)}
                disabled={subtitles.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0"
                title="Save the script (OCR results and translations) to a file"
              >
                <Download className="w-3.5 h-3.5 text-cyan-500" />
                <span>Export</span>
              </button>

              {isExportMenuOpen && (
                <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30 overflow-hidden animate-in fade-in">
                  <button
                    onClick={() => {
                      exportSubtitlesAsSrt(subtitles, episodeTitle);
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                  >
                    <span className="font-semibold block">Export as .srt</span>
                    <span className="text-gray-500 dark:text-gray-400">Mandarin + pinyin + English, playable in any subtitle app</span>
                  </button>
                  <button
                    onClick={() => {
                      exportSubtitlesAsJson(subtitles, episodeTitle);
                      setIsExportMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border-t border-gray-100 dark:border-gray-800 transition"
                  >
                    <span className="font-semibold block">Export as .json</span>
                    <span className="text-gray-500 dark:text-gray-400">Full data: every character's pinyin/tone and Taiwanese notes</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search characters, Pinyin (e.g. 'nǐ'), or English..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>

        {/* Phrase selection action bar */}
        {selectedPhrase && selectedPhrase.mandarin && (
          <div className="mt-3 p-2.5 rounded-xl bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800/60 flex items-center justify-between gap-2">
            <div className="min-w-0 flex items-baseline gap-2">
              <span className="font-serif text-base font-bold text-gray-900 dark:text-white truncate">
                {selectedPhrase.mandarin}
              </span>
              {selectedPhrase.pinyin && (
                <span className="font-mono text-xs text-yellow-700 dark:text-yellow-400 truncate">
                  {selectedPhrase.pinyin}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleSaveSelection}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-yellow-600 hover:bg-yellow-700 text-white transition"
              >
                <BookMarked className="w-3.5 h-3.5" />
                Save to Vocabulary
              </button>
              <button
                onClick={() => setPhraseSelection(null)}
                className="p-1 text-yellow-700 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-200 rounded transition"
                title="Clear selection"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Subtitles Scroll List */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 divide-y-0">
        {subtitles.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-900 text-cyan-500 flex items-center justify-center mx-auto">
              <Scan className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-gray-800 dark:text-gray-200">
                No Subtitle Track File? No Problem!
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
                Your video doesn't need external subtitle files. Use our Optical Character Recognition (OCR) scanner to read the burned-in Chinese dialogue directly off the bottom of the video frame.
              </p>
            </div>
            {onOpenOcrScanner && (
              <button
                onClick={onOpenOcrScanner}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-yellow-600 hover:from-cyan-700 hover:to-yellow-700 text-white font-bold text-xs shadow-md transition inline-flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Scan Video Frame Subtitles (OCR)
              </button>
            )}
          </div>
        ) : filteredSubtitles.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <p className="text-sm">No subtitles match your search.</p>
          </div>
        ) : (
          filteredSubtitles.map((line) => (
            <div
              key={line.id}
              id={`subtitle-${line.id}`}
              onClick={() => onJumpToTime(line.startTime)}
              className="cursor-pointer"
            >
              <SubtitleRubyLine
                line={line}
                isActive={line.id === activeLineId || line.id === loopingLineId}
                colorCodedTones={colorCodedTones}
                showZhuyin={showZhuyin}
                onSelectCharacter={onSelectCharacter}
                onAskAiAboutLine={onAskAiAboutLine}
                onJumpToTime={onJumpToTime}
                onLoopLine={onLoopLine}
                onDeleteLine={onDeleteLine}
                phraseSelectionMode={phraseSelectionMode}
                selectedCharRange={
                  phraseSelection && phraseSelection.lineId === line.id
                    ? { start: phraseSelection.start, end: phraseSelection.end }
                    : null
                }
                onCharacterRangeClick={handleCharacterRangeClick}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
