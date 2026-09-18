export interface CharacterToken {
  char: string;
  pinyin: string;
  tone: number; // 0 or 5 for neutral, 1, 2, 3, 4
  zhuyin?: string; // Bopomofo / Zhuyin symbol
  meaning?: string;
  isPunctuation?: boolean;
}

export interface SubtitleLine {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  mandarin: string; // Traditional Chinese (standard in Taiwanese dramas)
  simplified?: string;
  characters: CharacterToken[];
  english: string;
  taiwanNotes?: string; // Taiwanese slang, tone sandhi, Minnan loanword, cultural context
  speaker?: string;
}

export interface DramaEpisode {
  id: string;
  title: string;
  showName: string;
  year?: string;
  genre?: string;
  videoUrl: string;
  thumbnailUrl: string;
  description: string;
  subtitles: SubtitleLine[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  highlightedLineId?: string;
  selectedChar?: string;
}

export interface OcrResult {
  hasSubtitle: boolean;
  mandarin?: string;
  english?: string;
  taiwanNotes?: string;
  characters?: CharacterToken[];
  timestamp?: number;
  rawImagePreview?: string;
  message?: string;
  isUnavailable?: boolean;
}

export interface OcrScanOptions {
  intervalSeconds: number; // e.g., 2 seconds
  cropRegion: {
    topPercent: number; // e.g., 68 (meaning scan bottom 32% of video)
    bottomPercent: number; // e.g., 98
  };
  startSeconds: number;
  endSeconds: number;
}

