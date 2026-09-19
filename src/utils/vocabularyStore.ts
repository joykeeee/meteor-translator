// A vocabulary review list the learner builds by selecting phrases out of
// any episode's script. Stored in localStorage (not scoped per-episode, so
// it accumulates across every episode uploaded) and exportable as plaintext.

export interface VocabularyEntry {
  id: string;
  mandarin: string;
  pinyin: string;
  zhuyin: string;
  english: string;
  sourceEpisode: string;
  savedAt: number;
}

const STORAGE_KEY = 'meteor-translator:vocabulary';

export function getVocabulary(): VocabularyEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Could not read vocabulary list:', err);
    return [];
  }
}

function saveVocabulary(entries: VocabularyEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('Could not save vocabulary list:', err);
  }
}

export function addVocabularyEntry(entry: VocabularyEntry): VocabularyEntry[] {
  const updated = [entry, ...getVocabulary()];
  saveVocabulary(updated);
  return updated;
}

export function removeVocabularyEntry(id: string): VocabularyEntry[] {
  const updated = getVocabulary().filter((e) => e.id !== id);
  saveVocabulary(updated);
  return updated;
}

export function clearVocabulary(): VocabularyEntry[] {
  saveVocabulary([]);
  return [];
}

function downloadTextFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportVocabularyAsText(entries: VocabularyEntry[]): void {
  const date = new Date().toLocaleDateString();
  const header = `Meteor Translator — Vocabulary Review List\nExported ${date} · ${entries.length} entr${
    entries.length === 1 ? 'y' : 'ies'
  }\n\n`;
  const body = [...entries]
    .sort((a, b) => a.savedAt - b.savedAt)
    .map((e) => {
      const pronunciation = [e.pinyin, e.zhuyin].filter(Boolean).join(' / ');
      return `${e.mandarin}${pronunciation ? ` (${pronunciation})` : ''}\n${e.english}\nFrom: ${e.sourceEpisode}\n`;
    })
    .join('\n');
  downloadTextFile(header + body, 'meteor-translator-vocabulary.txt');
}
