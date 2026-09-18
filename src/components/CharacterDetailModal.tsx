import React from 'react';
import { X, Volume2, Sparkles, BookOpen, Layers } from 'lucide-react';
import { CharacterToken, SubtitleLine } from '../types';
import { getToneColor } from '../utils/pinyinUtils';
import { speakChinese } from '../utils/speechUtils';

interface CharacterDetailModalProps {
  token: CharacterToken | null;
  line: SubtitleLine | null;
  onClose: () => void;
  onAskAi: (char: string, line: SubtitleLine) => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  token,
  line,
  onClose,
  onAskAi,
}) => {
  if (!token || !line) return null;

  const toneColor = getToneColor(token.tone);

  const getToneDescription = (t: number) => {
    switch (t) {
      case 1:
        return '1st Tone (High & Flat, e.g. 55 pitch) — Keep pitch high and level';
      case 2:
        return '2nd Tone (Rising, e.g. 35 pitch) — Raise pitch like asking a question?';
      case 3:
        return '3rd Tone (Dipping / Low, e.g. 214 pitch) — Dip low then slight rise';
      case 4:
        return '4th Tone (Falling, e.g. 51 pitch) — Sharp drop like a definite command!';
      default:
        return 'Neutral Tone (Light & Soft) — Spoken swiftly without emphasis';
    }
  };

  const handleSpeak = () => {
    speakChinese(token.char);
  };

  const handleSpeakLine = () => {
    speakChinese(line.mandarin);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
              Character Inspector
            </span>
            <span className="text-xs text-slate-500">Taiwanese Mandarin</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Character Card Hero */}
        <div className="p-6 text-center border-b border-slate-100 dark:border-slate-800">
          {/* Pinyin with tone color */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <span className={`font-mono text-2xl font-bold tracking-tight ${toneColor.text}`}>
              {token.pinyin || '—'}
            </span>
            {token.zhuyin && (
              <span className="text-sm px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                注音: {token.zhuyin}
              </span>
            )}
          </div>

          {/* Big Character Display */}
          <div className="my-2">
            <span className="font-serif text-7xl font-bold text-slate-900 dark:text-white select-all">
              {token.char}
            </span>
          </div>

          {/* Tone description badge */}
          <div className="mt-3">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${toneColor.bg} ${toneColor.text} border ${toneColor.border}`}>
              {getToneDescription(token.tone)}
            </span>
          </div>

          {/* Audio trigger */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <button
              onClick={handleSpeak}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-rose-900 transition"
            >
              <Volume2 className="w-4 h-4 text-rose-500" />
              <span>Listen to "{token.char}"</span>
            </button>
          </div>
        </div>

        {/* In-Context Sentence Section */}
        <div className="p-5 space-y-3 text-xs sm:text-sm">
          <div>
            <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
              <span className="font-semibold">Context in this Subtitle Line:</span>
              <button
                onClick={handleSpeakLine}
                className="text-rose-600 hover:underline flex items-center gap-1"
              >
                <Volume2 className="w-3 h-3" />
                <span>Hear Full Line</span>
              </button>
            </div>
            <p className="font-serif text-base text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60">
              {line.mandarin}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 italic">
              "{line.english}"
            </p>
          </div>

          {line.taiwanNotes && (
            <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs">
              <span className="font-bold">Taiwanese Usage Note: </span>
              {line.taiwanNotes}
            </div>
          )}

          {/* Ask AI Tutor CTA */}
          <div className="pt-2">
            <button
              onClick={() => {
                onAskAi(token.char, line);
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-semibold text-xs sm:text-sm shadow-xs transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask AI Tutor About "{token.char}" &amp; Grammar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
