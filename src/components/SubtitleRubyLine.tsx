import React from 'react';
import { Volume2, Sparkles, RotateCcw, HelpCircle } from 'lucide-react';
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
  size?: 'normal' | 'large';
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
  size = 'normal',
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

  return (
    <div
      className={`group relative rounded-xl transition-all duration-200 p-4 border ${
        isActive
          ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-700 shadow-sm ring-1 ring-rose-300/60 dark:ring-rose-700/60'
          : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800'
      }`}
    >
      {/* Top bar with Speaker, Timestamp & Interactive actions */}
      <div className="flex items-center justify-between gap-2 mb-3 text-xs">
        <div className="flex items-center gap-2">
          {line.speaker && (
            <span className="font-semibold text-rose-700 dark:text-rose-400 bg-rose-100/60 dark:bg-rose-900/40 px-2 py-0.5 rounded">
              {line.speaker}
            </span>
          )}
          {onJumpToTime && (
            <button
              onClick={() => onJumpToTime(line.startTime)}
              className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 font-mono flex items-center gap-1 transition"
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
              className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition"
              title="Replay this line"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handlePlayAudio}
            className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded transition"
            title="Listen to Taiwanese Mandarin pronunciation"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
          {onAskAiAboutLine && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAskAiAboutLine(line);
              }}
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 rounded border border-amber-200 dark:border-amber-800 transition"
              title="Ask AI Agent about this dialogue"
            >
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Ask AI</span>
            </button>
          )}
        </div>
      </div>

      {/* Primary Mandarin Text with Aligned Pinyin Above Every Character */}
      <div className="flex flex-wrap items-end gap-x-1 sm:gap-x-1.5 gap-y-3 my-2 select-text leading-none">
        {line.characters.map((token, index) => {
          if (token.isPunctuation) {
            return (
              <span
                key={index}
                className={`self-end font-sans text-slate-400 dark:text-slate-500 px-0.5 ${
                  isLarge ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'
                }`}
              >
                {token.char}
              </span>
            );
          }

          const toneInfo = colorCodedTones ? getToneColor(token.tone) : { text: 'text-slate-600 dark:text-slate-300' };

          return (
            <button
              key={index}
              onClick={(e) => handleCharacterClick(e, token)}
              className={`group/char inline-flex flex-col items-center justify-end rounded-lg p-1 transition cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/70 focus:outline-none focus:ring-1 focus:ring-rose-400 ${
                isLarge ? 'min-w-[32px]' : 'min-w-[26px]'
              }`}
              title={`Click to inspect '${token.char}' (${token.pinyin}, Tone ${token.tone})`}
            >
              {/* Pinyin (Above the character) */}
              <span
                className={`font-mono font-medium tracking-tight whitespace-nowrap select-none transition-colors ${
                  isLarge ? 'text-xs sm:text-sm mb-1' : 'text-[11px] sm:text-xs mb-0.5'
                } ${toneInfo.text}`}
              >
                {token.pinyin || '·'}
              </span>

              {/* Optional Zhuyin (Bopomofo) */}
              {showZhuyin && token.zhuyin && (
                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono -mt-0.5 mb-0.5">
                  {token.zhuyin}
                </span>
              )}

              {/* Mandarin Character */}
              <span
                className={`font-serif tracking-normal text-slate-900 dark:text-slate-100 group-hover/char:text-rose-600 dark:group-hover/char:text-rose-400 transition-colors ${
                  isLarge ? 'text-2xl sm:text-3xl font-medium' : 'text-xl sm:text-2xl'
                }`}
              >
                {token.char}
              </span>
            </button>
          );
        })}
      </div>

      {/* English Translation (Below Mandarin characters) */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-700/60">
        <p className="text-sm sm:text-base text-slate-700 dark:text-slate-300 font-normal leading-relaxed">
          {line.english}
        </p>
      </div>

      {/* Taiwanese Cultural / Pronunciation / Slang Note */}
      {line.taiwanNotes && (
        <div className="mt-2.5 flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-200/90 bg-amber-50/80 dark:bg-amber-950/40 px-2.5 py-1.5 rounded-lg border border-amber-200/60 dark:border-amber-800/60">
          <span className="font-semibold shrink-0">🇹🇼 Accent &amp; Nuance:</span>
          <span className="leading-normal">{line.taiwanNotes}</span>
        </div>
      )}
    </div>
  );
};
