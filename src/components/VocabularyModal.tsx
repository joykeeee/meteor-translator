import React from 'react';
import { X, BookMarked, Download, Trash2, Volume2 } from 'lucide-react';
import { VocabularyEntry } from '../utils/vocabularyStore';
import { speakChinese } from '../utils/speechUtils';

interface VocabularyModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: VocabularyEntry[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onExport: () => void;
}

export const VocabularyModal: React.FC<VocabularyModalProps> = ({
  isOpen,
  onClose,
  entries,
  onRemove,
  onClearAll,
  onExport,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <BookMarked className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white">
                Vocabulary Review List
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {entries.length} saved phrase{entries.length === 1 ? '' : 's'}
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

        {/* Actions */}
        {entries.length > 0 && (
          <div className="px-4 sm:px-5 py-2.5 border-b border-gray-200 dark:border-gray-800 flex items-center gap-2">
            <button
              onClick={onExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export as .txt
            </button>
            <button
              onClick={() => {
                if (window.confirm('Clear the entire vocabulary list? This cannot be undone.')) {
                  onClearAll();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
            >
              Clear All
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {entries.length === 0 ? (
            <div className="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">
              No saved phrases yet. Turn on "Select Phrase" in the script panel, click a run of
              characters, then "Save to Vocabulary."
            </div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="p-3 rounded-xl border border-gray-200 dark:border-gray-700/80 bg-gray-50 dark:bg-gray-800/50 flex items-start justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-serif text-lg font-bold text-gray-900 dark:text-white">
                      {entry.mandarin}
                    </span>
                    {entry.pinyin && (
                      <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400">
                        {entry.pinyin}
                      </span>
                    )}
                    {entry.zhuyin && (
                      <span className="font-mono text-xs text-gray-400">{entry.zhuyin}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{entry.english}</p>
                  <p className="text-[11px] text-gray-400 mt-1 truncate">From: {entry.sourceEpisode}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => speakChinese(entry.mandarin)}
                    className="p-1.5 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded transition"
                    title="Listen"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onRemove(entry.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition"
                    title="Remove from vocabulary"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
