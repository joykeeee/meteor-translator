import { SubtitleLine } from '../types';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'episode';
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function pad(n: number, len: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(len, '0');
}

function toSrtTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds - Math.floor(seconds)) * 1000);
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)},${pad(ms, 3)}`;
}

// Full-fidelity export: every field the app tracks per line, including pinyin/zhuyin
// per character, tone numbers, and OCR/Taiwanese-accent notes. Best for re-importing
// or archiving a scan.
export function exportSubtitlesAsJson(subtitles: SubtitleLine[], episodeTitle: string) {
  const payload = {
    episodeTitle,
    exportedAt: new Date().toISOString(),
    lineCount: subtitles.length,
    subtitles,
  };
  downloadBlob(JSON.stringify(payload, null, 2), `${slugify(episodeTitle)}.json`, 'application/json');
}

// Portable subtitle file: Mandarin, pinyin (space-separated per character), and English
// stacked as three text lines per cue, playable/editable in any standard SRT-aware app.
export function exportSubtitlesAsSrt(subtitles: SubtitleLine[], episodeTitle: string) {
  const body = subtitles
    .map((line, i) => {
      const pinyinLine = line.characters
        .filter((c) => !c.isPunctuation)
        .map((c) => c.pinyin)
        .join(' ');
      const textLines = [line.mandarin, pinyinLine, line.english].filter(Boolean);
      return `${i + 1}\n${toSrtTimestamp(line.startTime)} --> ${toSrtTimestamp(line.endTime)}\n${textLines.join('\n')}`;
    })
    .join('\n\n');
  downloadBlob(body, `${slugify(episodeTitle)}.srt`, 'text/plain');
}
