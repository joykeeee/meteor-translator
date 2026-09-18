// Text-to-speech utility using Web Speech API with Taiwanese Mandarin preference

let cachedVoices: SpeechSynthesisVoice[] = [];

// Pre-fetch voices as soon as available in the browser
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  cachedVoices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

function getVoicesAsync(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const immediate = window.speechSynthesis.getVoices();
    if (immediate && immediate.length > 0) {
      cachedVoices = immediate;
      resolve(immediate);
      return;
    }

    // Wait for voiceschanged or timeout after 500ms
    const handleVoices = () => {
      const v = window.speechSynthesis.getVoices();
      cachedVoices = v;
      resolve(v);
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoices, { once: true });
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices());
    }, 500);
  });
}

export async function speakChinese(text: string, rate: number = 0.85): Promise<void> {
  return new Promise(async (resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser.');
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // cancel any ongoing speech
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate; // slightly slower for language learners
      utterance.pitch = 1.0;

      const voices = cachedVoices.length > 0 ? cachedVoices : await getVoicesAsync();

      // Pick best Taiwanese Mandarin voice if available, otherwise Chinese
      const twVoice = voices.find(
        (v) =>
          v.lang === 'zh-TW' ||
          v.lang.includes('TW') ||
          v.name.includes('Taiwan') ||
          v.name.includes('Traditional') ||
          v.name.includes('Mei-Jia') ||
          v.name.includes('Hanhan')
      );
      const zhVoice = voices.find((v) => v.lang.startsWith('zh'));

      if (twVoice) {
        utterance.voice = twVoice;
        utterance.lang = 'zh-TW';
      } else if (zhVoice) {
        utterance.voice = zhVoice;
        utterance.lang = zhVoice.lang;
      } else {
        utterance.lang = 'zh-TW';
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Speech synthesis exception:', err);
      resolve();
    }
  });
}

