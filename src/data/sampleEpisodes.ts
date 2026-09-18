import { DramaEpisode } from '../types';
import { parseChineseToTokens } from '../utils/pinyinUtils';

export const SAMPLE_EPISODES: DramaEpisode[] = [
  {
    id: 'someday-or-one-day',
    title: 'Episode 3: The Cassette Tape & The Rain',
    showName: '想見你 (Someday or One Day)',
    year: '2019',
    genre: 'Romantic Mystery / Time Slip',
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80',
    // Public domain royalty-free ambient video clip that plays seamlessly
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    description: 'Huang Yu-hsuan listens to Wu Bai\'s "Last Dance" on a vintage Walkman and finds herself transported back to 1998 Tainan, meeting Li Zi-wei who looks identical to her lost love.',
    subtitles: [
      {
        id: 'line-1',
        startTime: 0,
        endTime: 4.5,
        mandarin: '如果有一天，我不再是黃雨萱，你還會喜歡我嗎？',
        characters: parseChineseToTokens('如果有一天，我不再是黃雨萱，你還會喜歡我嗎？'),
        english: 'If one day I am no longer Huang Yu-hsuan, will you still like me?',
        taiwanNotes: 'Notice the conditional sentence pattern "如果...的話". In Taiwanese Mandarin, the sentence-final question particle "嗎" is pronounced very softly.',
        speaker: '黃雨萱 (Huang Yu-hsuan)'
      },
      {
        id: 'line-2',
        startTime: 4.6,
        endTime: 8.8,
        mandarin: '傻瓜，只有你想見我的時候，我們的相遇才有意義。',
        characters: parseChineseToTokens('傻瓜，只有你想見我的時候，我們的相遇才有意義。'),
        english: 'Silly girl, only when you want to see me does our encounter have meaning.',
        taiwanNotes: '"傻瓜" (shǎguā) is an affectionate term of endearment. The title phrase "想見你" (xiǎng jiàn nǐ) means "longing to see you".',
        speaker: '李子維 (Li Zi-wei)'
      },
      {
        id: 'line-3',
        startTime: 9.0,
        endTime: 12.5,
        mandarin: '真的假的啦？你每次都只會講這種甜言蜜語。',
        characters: parseChineseToTokens('真的假的啦？你每次都只會講這種甜言蜜語。'),
        english: 'Really? No way! Every time you only know how to say sweet nothings.',
        taiwanNotes: 'Quintessential Taiwanese phrase: "真的假的" (zhēnde jiǎde = "No way! / For real?") combined with the classic Taiwanese exclamation particle "啦" (la).',
        speaker: '黃雨萱 (Huang Yu-hsuan)'
      },
      {
        id: 'line-4',
        startTime: 12.6,
        endTime: 15.0,
        mandarin: '哪有！我對你說的每一句話都是認真的好不好。',
        characters: parseChineseToTokens('哪有！我對你說的每一句話都是認真的好不好。'),
        english: 'Not at all! Every single word I say to you is completely sincere, okay?',
        taiwanNotes: '"哪有" (nǎ yǒu) is the classic Taiwanese way to playfully protest "as if / that is not true!". "好不好" softens the statement.',
        speaker: '李子維 (Li Zi-wei)'
      }
    ]
  },
  {
    id: 'in-time-with-you',
    title: 'Episode 5: Thirty Years Old & Beer on the Balcony',
    showName: '我可能不會愛你 (In Time with You)',
    year: '2011',
    genre: 'Urban Romance / Friendship',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    description: 'Cheng You-ching and Li Da-ren drink beer on the balcony discussing turning thirty, career frustrations, and their unbreakable 14-year friendship.',
    subtitles: [
      {
        id: 'ity-1',
        startTime: 0,
        endTime: 3.8,
        mandarin: '李大仁，你說三十歲到底是怎麼樣的一種感覺啊？',
        characters: parseChineseToTokens('李大仁，你說三十歲到底是怎麼樣的一種感覺啊？'),
        english: 'Li Da-ren, what kind of feeling is turning thirty after all?',
        taiwanNotes: '"到底" (dàodǐ) emphasizes the question ("on earth / after all"). Notice final particle "啊" (a) expressing contemplative tone.',
        speaker: '程又青 (Cheng You-ching)'
      },
      {
        id: 'ity-2',
        startTime: 4.0,
        endTime: 8.2,
        mandarin: '就像一瓶放了很久的紅酒，越陳越香，越來越有自己的味道。',
        characters: parseChineseToTokens('就像一瓶放了很久的紅酒，越陳越香，越來越有自己的味道。'),
        english: 'Just like a bottle of red wine aged for a long time—the older it gets, the richer the aroma, developing its own distinct character.',
        taiwanNotes: '"越...越..." (yuè...yuè...) structure: "the more... the more...". "味道" (wèidào) here metaphorically means individual charm or character.',
        speaker: '李大仁 (Li Da-ren)'
      },
      {
        id: 'ity-3',
        startTime: 8.5,
        endTime: 12.0,
        mandarin: '少來了！你少哄我開心，我今天在公司被客戶氣死了。',
        characters: parseChineseToTokens('少來了！你少哄我開心，我今天在公司被客戶氣死了。'),
        english: 'Come on, stop joking! Stop flattering me to cheer me up; I was infuriated by a client at the office today.',
        taiwanNotes: '"少來了" (shǎo lái le) is extremely common in Taiwan for "Stop it / You are teasing me". "氣死了" is a vivid hyperbole for furious/annoyed.',
        speaker: '程又青 (Cheng You-ching)'
      },
      {
        id: 'ity-4',
        startTime: 12.2,
        endTime: 15.0,
        mandarin: '安啦，喝酒解悶，有我在這裡聽你抱怨。',
        characters: parseChineseToTokens('安啦，喝酒解悶，有我在這裡聽你抱怨。'),
        english: 'Don\'t worry, relax! Drink some beer to unwind; I\'m right here to listen to you vent.',
        taiwanNotes: '"安啦" (ān la) is an everyday Taiwanese slang contraction of "放寬心 / 安心啦" meaning "Don\'t sweat it / You\'re safe".',
        speaker: '李大仁 (Li Da-ren)'
      }
    ]
  },
  {
    id: 'light-the-night',
    title: 'Episode 1: Rose Bar in Tiaotong Alley',
    showName: '華燈初上 (Light the Night)',
    year: '2021',
    genre: '1980s Taipei Noir / Drama',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&auto=format&fit=crop&q=80',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    description: 'Set in 1988 Taipei\'s red light district of Tiaotong, Mama-san Rose and Sue navigate love, jealousy, secrets, and life among hostesses at the Hikari piano bar.',
    subtitles: [
      {
        id: 'ltn-1',
        startTime: 0,
        endTime: 4.2,
        mandarin: '歡迎光臨「光」，今晚想要喝點什麼呢？',
        characters: parseChineseToTokens('歡迎光臨「光」，今晚想要喝點什麼呢？'),
        english: 'Welcome to Hikari, what would you like to drink tonight?',
        taiwanNotes: 'Professional Taiwanese hospitality greeting. "喝點什麼" softens the offer compared to direct "喝什麼".',
        speaker: '蘿絲媽媽 (Rose Mama)'
      },
      {
        id: 'ltn-2',
        startTime: 4.4,
        endTime: 9.0,
        mandarin: '人生啊，哪有那麼多如果？發生了就是發生了。',
        characters: parseChineseToTokens('人生啊，哪有那麼多如果？發生了就是發生了。'),
        english: 'In life, how could there be so many "what ifs"? What happened has happened.',
        taiwanNotes: '"人生啊" (rénshēng a) philosophical sigh. "哪有" used rhetorically to question the premise of regret.',
        speaker: '蘇慶儀 (Sue)'
      },
      {
        id: 'ltn-3',
        startTime: 9.2,
        endTime: 14.8,
        mandarin: '歹勢啦，剛才話說得太重了，我敬你一杯賠罪。',
        characters: parseChineseToTokens('歹勢啦，剛才話說得太重了，我敬你一杯賠罪。'),
        english: 'I\'m so sorry! I spoke too harshly just now; let me toast you a glass to apologize.',
        taiwanNotes: '"歹勢" (pháinn-sè, written in Mandarin as 歹勢/拍寫) is the famous Taiwanese Hokkien loanword ubiquitous in Taiwan meaning "Excuse me / I am so sorry".',
        speaker: '蘿絲媽媽 (Rose Mama)'
      }
    ]
  }
];
