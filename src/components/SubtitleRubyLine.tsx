import React from 'react';
import { Volume2, Sparkles, RotateCcw, HelpCircle, Trash2 } from 'lucide-react';
import { SubtitleLine, CharacterToken } from '../types';
import { getToneColor } from '../utils/pinyinUtils';
import { speakChinese } from '../utils/speechUtils';

interface SubtitleRubyLineProps {
  line: SubtitleLine;
  isActive?: boolean;
  colorCodedTones?: boolean;
  showZhuyin?: boolean;
  onSelectCharacter?: (token: CharacterToken, line: SubtitleLine) => void;
  onAskAiAboutLine?: (line: SubtitleLine) => void;
  onJumpToTime?: (time: number) => void;
  onLoopLine?: (line: SubtitleLine) => void;
  onDeleteLine?: (line: SubtitleLine) => void;
  size?: 'compact' | 'normal' | 'large';
  hideTaiwanNotes?: boolean;
}

export const SubtitleRubyLine: React.FC<SubtitleRubyLineProps> = ({
  line,
  isActive = false,
  colorCodedTones = true,
  showZhuyin = false,
  onSelectCharacter,
  onAskAiAboutLine,
  onJumpToTime,
  onLoopLine,
  onDeleteLine,
  size = 'normal',
  hideTaiwanNotes = false,
}) => {
  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    speakChinese(line.mandarin);
  };

  const handleCharacterClick = (e: React.MouseEvent, token: CharacterToken) => {
    e.stopPropagation();
    if (!token.isPunctuation && onSelectCharacter) {
      speakChinese(token.char);
      onSelectCharacter(token, line);
    }
  };

  const isLarge = size === 'large';
  const isCompact = size === 'compact';

  return (
    <div
      className={`group relative rounded-xl transition-all duration-200 border ${isCompact ? 'p-2' : 'p-4'} ${
        isActive
          ? 'bg-cyan-50/70 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-700 shadow-sm ring-1 ring-cyan-300/60 dark:ring-cyan-700/60'
          : 'bg-white dark:bg-gray-800/80 border-gray-200/80 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50/50 dark:hover:bg-gray-800'
      }`}
    >
      {/* Top bar with Speaker, Timestamp & Interactive actions */}
      <div className={`flex items-center justify-between gap-2 text-xs ${isCompact ? 'mb-1' : 'mb-3'}`}>
        <div className="flex items-center gap-2">
          {line.speaker && (
            <span className="font-semibold text-cyan-700 dark:text-cyan-400 bg-cyan-100/60 dark:bg-cyan-900/40 px-2 py-0.5 rounded">
              {line.speaker}
            </span>
          )}
          {onJumpToTime && (
            <button
              onClick={() => onJumpToTime(line.startTime)}
              className="text-gray-500 hover:text-cyan-600 dark:text-gray-400 dark:hover:text-cyan-400 font-mono flex items-center gap-1 transition"
              title="Click to jump to this moment in video"
            >
              <span>▶</span>
              <span>{Math.floor(line.startTime / 60)}:{(line.startTime % 60).toFixed(0).padStart(2, '0')}</span>
            </button>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          {onLoopLine && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLoopLine(line);
              }}
              className={`text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition ${isCompact ? 'p-1' : 'p-1.5'}`}
              title="Replay this line"
            >
              <RotateCcw className={isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            </button>
          )}
          <button
            onClick={handlePlayAudio}
            className={`text-gray-500 hover:text-cyan-600 dark:text-gray-400 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-900/40 rounded transition ${isCompact ? 'p-1' : 'p-1.5'}`}
            title="Listen to Taiwanese Mandarin pronunciation"
          >
            <Volume2 className={isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
          </button>
          {onAskAiAboutLine && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAskAiAboutLine(line);
              }}
              className={`flex items-center gap-1 font-medium text-yellow-700 dark:text-yellow-300 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-950/50 dark:hover:bg-yellow-900/60 rounded border border-yellow-200 dark:border-yellow-800 transition ${isCompact ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-[11px]'}`}
              title="Ask AI Agent about this dialogue"
            >
              <Sparkles className={isCompact ? 'w-2.5 h-2.5 text-yellow-500' : 'w-3 h-3 text-yellow-500'} />
              <span>Ask AI</span>
            </button>
          )}
          {onDeleteLine && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete this line from the script?\n\n${line.mandarin}\n${line.english}`)) {
                  onDeleteLine(line);
                }
              }}
              className={`text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition ${isCompact ? 'p-1' : 'p-1.5'}`}
              title="Delete this line from the script"
            >
              <Trash2 className={isCompact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            </button>
          )}
        </div>
      </div>

      {/* Primary Mandarin Text with Aligned Pinyin Above Every Character */}
      <div className={`flex flex-wrap items-end gap-x-1 sm:gap-x-1.5 select-text leading-none ${isCompact ? 'gap-y-1 my-0.5' : 'gap-y-3 my-2'}`}>
        {line.characters.map((token, index) => {
          if (token.isPunctuation) {
            return (
              <span
                key={index}
                className={`self-end font-sans text-gray-400 dark:text-gray-500 px-0.5 ${
                  isCompact ? 'text-sm sm:text-base' : isLarge ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                }`}
              >
                {token.char}
              </span>
            );
          }

          const toneInfo = colorCodedTones ? getToneColor(token.tone) : { text: 'text-gray-600 dark:text-gray-300' };

          return (
            <button
              key={index}
              onClick={(e) => handleCharacterClick(e, token)}
              className={`group/char inline-flex flex-col items-center justify-end rounded-lg transition cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/70 focus:outline-none focus:ring-1 focus:ring-cyan-400 ${
                isCompact ? 'p-0.5 min-w-[16px]' : 'p-1'
              } ${isLarge ? 'min-w-[32px]' : !isCompact ? 'min-w-[26px]' : ''}`}
              title={`Click to inspect '${token.char}' (${token.pinyin}, Tone ${token.tone})`}
            >
              {/* Pinyin (Above the character) */}
              <span
                className={`font-mono font-medium tracking-tight whitespace-nowrap select-none transition-colors ${
                  isCompact ? 'text-[8px] mb-0' : isLarge ? 'text-xs sm:text-sm mb-1' : 'text-[11px] sm:text-xs mb-0.5'
                } ${toneInfo.text}`}
              >
                {token.pinyin || '·'}
              </span>

              {/* Optional Zhuyin (Bopomofo) */}
              {showZhuyin && token.zhuyin && (
                <span className="text-[9px] text-gray-400 dark:text-gray-500 font-mono -mt-0.5 mb-0.5">
                  {token.zhuyin}
                </span>
              )}

              {/* Mandarin Character */}
              <span
                className={`font-serif tracking-normal text-gray-900 dark:text-gray-100 group-hover/char:text-cyan-600 dark:group-hover/char:text-cyan-400 transition-colors ${
                  isCompact ? 'text-sm sm:text-base' : isLarge ? 'text-2xl sm:text-3xl font-medium' : 'text-xl sm:text-2xl'
                }`}
              >
                {token.char}
              </span>
            </button>
          );
        })}
      </div>

      {/* English Translation (Below Mandarin characters) */}
      <div className={`border-t border-gray-100 dark:border-gray-700/60 ${isCompact ? 'mt-1 pt-1' : 'mt-3 pt-2.5'}`}>
        <p className={`text-gray-700 dark:text-gray-300 font-normal ${isCompact ? 'text-xs leading-snug' : 'text-sm sm:text-base leading-relaxed'}`}>
          {line.english}
        </p>
      </div>

      {/* Taiwanese Cultural / Pronunciation / Slang Note */}
      {!hideTaiwanNotes && line.taiwanNotes && (
        <div className="mt-2.5 flex items-start gap-1.5 text-xs text-yellow-800 dark:text-yellow-200/90 bg-yellow-50/80 dark:bg-yellow-950/40 px-2.5 py-1.5 rounded-lg border border-yellow-200/60 dark:border-yellow-800/60">
          <span className="font-semibold shrink-0">🇹🇼 Accent &amp; Nuance:</span>
          <span className="leading-normal">{line.taiwanNotes}</span>
        </div>
      )}
    </div>
  );
};
