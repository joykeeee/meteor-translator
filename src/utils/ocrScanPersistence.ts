import { SubtitleLine } from '../types';
import { CropRegion } from './ocrService';

// Lets the Auto-Scan Video Timeline OCR scanner survive a refresh or closed
// tab: progress is written incrementally as each frame is scanned, keyed per
// episode, and read back the next time the scanner modal opens for that
// same episode.

export interface OcrScanProgress {
  lines: SubtitleLine[];
  lastScannedTime: number;
  startTime: number;
  endTime: number;
  interval: number;
  cropRegion: CropRegion;
  savedAt: number;
}

const KEY_PREFIX = 'meteor-translator:ocr-scan:';

function keyFor(episodeTitle: string): string {
  return KEY_PREFIX + episodeTitle;
}

export function saveOcrScanProgress(
  episodeTitle: string,
  progress: Omit<OcrScanProgress, 'savedAt'>
): void {
  try {
    const payload: OcrScanProgress = { ...progress, savedAt: Date.now() };
    localStorage.setItem(keyFor(episodeTitle), JSON.stringify(payload));
  } catch (err) {
    console.warn('Could not save OCR scan progress:', err);
  }
}

export function loadOcrScanProgress(episodeTitle: string): OcrScanProgress | null {
  try {
    const raw = localStorage.getItem(keyFor(episodeTitle));
    if (!raw) return null;
    return JSON.parse(raw) as OcrScanProgress;
  } catch (err) {
    console.warn('Could not load OCR scan progress:', err);
    return null;
  }
}

export function clearOcrScanProgress(episodeTitle: string): void {
  try {
    localStorage.removeItem(keyFor(episodeTitle));
  } catch (err) {
    console.warn('Could not clear OCR scan progress:', err);
  }
}
