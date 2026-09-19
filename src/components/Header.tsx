import React from 'react';
import { Sparkles, Video, MessageSquare, Volume2, BookOpen, Settings, BookMarked } from 'lucide-react';

interface HeaderProps {
  onOpenVideoModal: () => void;
  onToggleChat: () => void;
  isChatOpen: boolean;
  unreadCount?: number;
  showZhuyin: boolean;
  onToggleZhuyin: () => void;
  colorCodedTones: boolean;
  onToggleColorTones: () => void;
  vocabularyCount: number;
  onOpenVocabulary: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenVideoModal,
  onToggleChat,
  isChatOpen,
  showZhuyin,
  onToggleZhuyin,
  colorCodedTones,
  onToggleColorTones,
  vocabularyCount,
  onOpenVocabulary,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Current Episode */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-yellow-500 flex items-center justify-center text-white shadow-sm shrink-0">
            <span className="font-bold text-lg tracking-wider font-serif">台</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
                Meteor Translator
              </h1>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Taiwanese Mandarin Subtitle &amp; Pronunciation Tutor
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Tone & Zhuyin Toggles */}
          <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border border-gray-200 dark:border-gray-700 text-xs">
            <button
              onClick={onToggleColorTones}
              className={`px-2.5 py-1 rounded font-medium transition ${
                colorCodedTones
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
              title="Color-code pinyin tones (1st red, 2nd amber, 3rd green, 4th blue)"
            >
              Tone Colors
            </button>
            <button
              onClick={onToggleZhuyin}
              className={`px-2.5 py-1 rounded font-medium transition ${
                showZhuyin
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
              title="Toggle Taiwanese Zhuyin / Bopomofo (注音符號)"
            >
              注音 Zhuyin
            </button>
          </div>

          {/* Upload / Link Video Button */}
          <button
            onClick={onOpenVideoModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300/80 dark:border-gray-700 transition"
          >
            <Video className="w-4 h-4 text-gray-500" />
            <span className="hidden sm:inline">Upload / Link Episode</span>
            <span className="sm:hidden">Video</span>
          </button>

          {/* Vocabulary Review List Button */}
          <button
            onClick={onOpenVocabulary}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300/80 dark:border-gray-700 transition whitespace-nowrap shrink-0"
            title="Saved phrases from every episode you've worked with"
          >
            <BookMarked className="w-4 h-4 text-gray-500" />
            <span className="hidden sm:inline">Vocabulary</span>
            {vocabularyCount > 0 && (
              <span className="text-[10px] bg-cyan-600 text-white px-1.5 py-0.2 rounded-full font-mono">
                {vocabularyCount}
              </span>
            )}
          </button>

          {/* AI Chatbot Agent Button */}
          <button
            onClick={onToggleChat}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition ${
              isChatOpen
                ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                : 'bg-gradient-to-r from-cyan-600 to-yellow-600 hover:from-cyan-500 hover:to-yellow-500 text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>AI Tutor</span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono">Agent</span>
          </button>
        </div>
      </div>
    </header>
  );
};
