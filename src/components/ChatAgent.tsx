import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, Volume2, RotateCcw, MessageSquare, Bot, User } from 'lucide-react';
import { ChatMessage, SubtitleLine } from '../types';
import { speakChinese } from '../utils/speechUtils';

interface ChatAgentProps {
  isOpen: boolean;
  onClose: () => void;
  currentEpisodeTitle: string;
  selectedLine?: SubtitleLine;
  selectedChar?: string;
  onClearSelection?: () => void;
  chatHistory: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
}

export const ChatAgent: React.FC<ChatAgentProps> = ({
  isOpen,
  onClose,
  currentEpisodeTitle,
  selectedLine,
  selectedChar,
  onClearSelection,
  chatHistory,
  onSendMessage,
  isLoading,
}) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, isOpen, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const msg = inputText.trim();
    setInputText('');
    onSendMessage(msg);
  };

  const handleQuickPrompt = (prompt: string) => {
    if (isLoading) return;
    onSendMessage(prompt);
  };

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-xl z-20">
      {/* Top Header */}
      <div className="px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-yellow-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Mandarin Drama Tutor</span>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold px-1.5 py-0.2 rounded">
                AI Agent
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Ask about Pinyin, tones, Taiwanese slang, &amp; grammar
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition"
          title="Close tutor chat"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Active Selection Context Tag */}
      {(selectedChar || selectedLine) && (
        <div className="bg-cyan-50/90 dark:bg-cyan-950/40 px-4 py-2 border-b border-cyan-100 dark:border-cyan-900/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 truncate">
            <span className="font-semibold text-cyan-800 dark:text-cyan-300 shrink-0">Selected:</span>
            {selectedChar && (
              <span className="font-serif font-bold text-base text-cyan-900 dark:text-cyan-100 bg-white dark:bg-slate-800 px-2 py-0.5 rounded shadow-2xs">
                {selectedChar}
              </span>
            )}
            {selectedLine && (
              <span className="truncate text-cyan-700 dark:text-cyan-300/90">
                "{selectedLine.mandarin}"
              </span>
            )}
          </div>
          {onClearSelection && (
            <button
              onClick={onClearSelection}
              className="text-cyan-500 hover:text-cyan-700 dark:hover:text-cyan-300 p-0.5 ml-2"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatHistory.length === 0 ? (
          <div className="text-center py-6 px-2 text-slate-500 dark:text-slate-400">
            <div className="w-12 h-12 rounded-full bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 mx-auto flex items-center justify-center mb-3">
              <Bot className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200 mb-1">
              Ready to help you master Taiwanese drama dialogs!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
              Click any character in the script or ask questions below about pronunciations, tone rules, or colloquial Taiwanese expressions.
            </p>

            {/* Suggested Quick Prompts */}
            <div className="space-y-1.5 text-left">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Suggested questions:
              </p>
              {[
                'Why is Taiwanese Mandarin pronounced differently from standard Beijing Mandarin?',
                'Explain how tone changes (Tone Sandhi) work in these subtitles.',
                'What does "真的假的啦" mean in Taiwanese dramas?',
                'What are common Taiwanese modal particles like 啦, 吼, 欸, 喔?',
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickPrompt(suggestion)}
                  className="w-full text-left p-2 rounded-lg text-xs bg-slate-50 dark:bg-slate-800/80 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 hover:border-cyan-300 border border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 transition"
                >
                  💬 {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-yellow-500 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-2xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-cyan-600 text-white rounded-br-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-xs border border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                {/* Render markdown-like text */}
                <div className="whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                {/* Assistant audio button if containing Chinese */}
                {msg.role === 'assistant' && /[\u4e00-\u9fa5]/.test(msg.content) && (
                  <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-2">
                    <button
                      onClick={() => {
                        const chineseText = (msg.content.match(/[\u4e00-\u9fa5]+/g) || []).join(' ');
                        if (chineseText) speakChinese(chineseText);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-400 font-medium transition"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Hear Pronunciation</span>
                    </button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex gap-2.5 items-center text-slate-400 text-xs py-2">
            <div className="w-7 h-7 rounded-full bg-cyan-500 text-white flex items-center justify-center shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 px-3.5 py-2.5 rounded-2xl rounded-bl-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-slate-500 font-medium text-xs">AI Tutor is typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder={
              selectedChar
                ? `Ask about '${selectedChar}' pronunciation, tone, or meaning...`
                : selectedLine
                ? `Ask about this subtitle line or translation...`
                : `Ask about any pronunciation, Pinyin, or Taiwanese slang...`
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isLoading}
            className="w-full pl-3.5 pr-10 py-2.5 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-slate-900 dark:text-white placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="absolute right-2 p-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition disabled:opacity-40 disabled:hover:bg-cyan-600"
            title="Send"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
