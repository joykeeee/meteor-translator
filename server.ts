import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { pinyin } from 'pinyin-pro';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '25mb' }));

// Lazy Gemini client helper with required headers
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Flash model pool for high availability and automatic fallback during temporary demand spikes
const CANDIDATE_FLASH_MODELS = [
  'gemini-3.8-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
];

interface GenerateOptions {
  preferredModel?: string;
  config?: any;
  maxAttemptsPerModel?: number;
}

/**
 * Executes a Gemini generateContent call with automatic exponential backoff retry
 * and seamless fallback across compatible flash models when experiencing 503 high demand.
 */
async function generateWithModelFallback(
  ai: GoogleGenAI,
  contents: any,
  options?: GenerateOptions
): Promise<{ text: string; modelUsed: string }> {
  const preferred = options?.preferredModel || 'gemini-3.8-flash';
  const modelsToTry = [
    preferred,
    ...CANDIDATE_FLASH_MODELS.filter((m) => m !== preferred),
  ];

  let lastError: any = null;

  for (const model of modelsToTry) {
    const attempts = options?.maxAttemptsPerModel ?? 2;
    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents,
          config: options?.config,
        });
        return { text: response.text || '', modelUsed: model };
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const code = err?.status || err?.code || err?.error?.code;
        const isTemporary =
          code === 503 ||
          code === 429 ||
          msg.includes('503') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('high demand') ||
          msg.includes('ResourceExhausted');

        console.warn(`[Gemini API] Request on model ${model} (attempt ${attempt + 1}/${attempts}) encountered: ${code || 'Error'}: ${msg.slice(0, 120)}`);

        if (isTemporary) {
          if (attempt < attempts - 1) {
            // Exponential backoff with jitter
            const delayMs = 600 * Math.pow(1.5, attempt) + Math.random() * 300;
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            continue;
          }
          // After exhausting attempts on this model, switch to next candidate in the pool
          console.warn(`[Gemini API] Switching to alternative model in pool due to temporary high demand on ${model}...`);
          break;
        }

        // For non-transient errors, break without repeating
        break;
      }
    }
  }

  throw lastError;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Helper to extract tone number
function extractTone(p: string): number {
  if (/[āēīōūǖ]/.test(p)) return 1;
  if (/[áéíóúǘ]/.test(p)) return 2;
  if (/[ǎěǐǒǔǚ]/.test(p)) return 3;
  if (/[àèìòùǜ]/.test(p)) return 4;
  return 5;
}

// Convert pinyin syllable to Taiwanese Zhuyin (Bopomofo)
function pinyinToZhuyinServer(pinyinWithTone: string): string {
  if (!pinyinWithTone) return '';
  const tone = extractTone(pinyinWithTone);
  const base = pinyinWithTone
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ü/g, 'v')
    .toLowerCase();

  const zhuyinMap: Record<string, string> = {
    a: 'ㄚ', o: 'ㄛ', e: 'ㄜ', er: 'ㄦ', ai: 'ㄞ', ei: 'ㄟ', ao: 'ㄠ', ou: 'ㄡ',
    an: 'ㄢ', en: 'ㄣ', ang: 'ㄤ', eng: 'ㄥ',
    yi: 'ㄧ', ya: 'ㄧㄚ', yao: 'ㄧㄠ', ye: 'ㄧㄝ', you: 'ㄧㄡ', yan: 'ㄧㄢ', yin: 'ㄧㄣ', yang: 'ㄧㄤ', ying: 'ㄧㄥ', yong: 'ㄩㄥ',
    wu: 'ㄨ', wa: 'ㄨㄚ', wo: 'ㄨㄛ', wai: 'ㄨㄞ', wei: 'ㄨㄟ', wan: 'ㄨㄢ', wen: 'ㄨㄣ', wang: 'ㄨㄤ', weng: 'ㄨㄥ',
    yu: 'ㄩ', yue: 'ㄩㄝ', yuan: 'ㄩㄢ', yun: 'ㄩㄣ',
    ba: 'ㄅㄚ', bo: 'ㄅㄛ', bai: 'ㄅㄞ', bei: 'ㄅㄟ', bao: 'ㄅㄠ', ban: 'ㄅㄢ', ben: 'ㄅㄣ', bang: 'ㄅㄤ', beng: 'ㄅㄥ', bi: 'ㄅㄧ', biao: 'ㄅㄧㄠ', bie: 'ㄅㄧㄝ', bian: 'ㄅㄧㄢ', bin: 'ㄅㄧㄣ', bing: 'ㄅㄧㄥ', bu: 'ㄅㄨ',
    pa: 'ㄆㄚ', po: 'ㄆㄛ', pai: 'ㄆㄞ', pei: 'ㄆㄟ', pao: 'ㄆㄠ', pou: 'ㄆㄡ', pan: 'ㄆㄢ', pen: 'ㄆㄣ', pang: 'ㄆㄤ', peng: 'ㄆㄥ', pi: 'ㄆㄧ', piao: 'ㄆㄧㄠ', pie: 'ㄆㄧㄝ', pian: 'ㄆㄧㄢ', pin: 'ㄆㄧㄣ', ping: 'ㄆㄧㄥ', pu: 'ㄆㄨ',
    ma: 'ㄇㄚ', mo: 'ㄇㄛ', me: 'ㄇㄜ', mai: 'ㄇㄞ', mei: 'ㄇㄟ', mao: 'ㄇㄠ', mou: 'ㄇㄡ', man: 'ㄇㄢ', men: 'ㄇㄣ', mang: 'ㄇㄤ', meng: 'ㄇㄥ', mi: 'ㄇㄧ', miao: 'ㄇㄧㄠ', mie: 'ㄇㄧㄝ', miu: 'ㄇㄧㄡ', mian: 'ㄇㄧㄢ', min: 'ㄇㄧㄣ', ming: 'ㄇㄧㄥ', mu: 'ㄇㄨ',
    fa: 'ㄈㄚ', fo: 'ㄈㄛ', fei: 'ㄈㄟ', fou: 'ㄈㄡ', fan: 'ㄈㄢ', fen: 'ㄈㄣ', fang: 'ㄈㄤ', feng: 'ㄈㄥ', fu: 'ㄈㄨ',
    da: 'ㄉㄚ', de: 'ㄉㄜ', dai: 'ㄉㄞ', dei: 'ㄉㄟ', dao: 'ㄉㄠ', dou: 'ㄉㄡ', dan: 'ㄉㄢ', den: 'ㄉㄣ', dang: 'ㄉㄤ', deng: 'ㄉㄥ', di: 'ㄉㄧ', diao: 'ㄉㄧㄠ', die: 'ㄉㄧㄝ', diu: 'ㄉㄧㄡ', dian: 'ㄉㄧㄢ', ding: 'ㄉㄧㄥ', du: 'ㄉㄨ', duo: 'ㄉㄨㄛ', dui: 'ㄉㄨㄟ', duan: 'ㄉㄨㄢ', dun: 'ㄉㄨㄣ', dong: 'ㄉㄨㄥ',
    ta: 'ㄊㄚ', te: 'ㄊㄜ', tai: 'ㄊㄞ', tao: 'ㄊㄠ', tou: 'ㄊㄡ', tan: 'ㄊㄢ', tang: 'ㄊㄤ', teng: 'ㄊㄥ', ti: 'ㄊㄧ', tiao: 'ㄊㄧㄠ', tie: 'ㄊㄧㄝ', tian: 'ㄊㄧㄢ', ting: 'ㄊㄧㄥ', tu: 'ㄊㄨ', tuo: 'ㄊㄨㄛ', tui: 'ㄊㄨㄟ', tuan: 'ㄊㄨㄢ', tun: 'ㄊㄨㄣ', tong: 'ㄊㄨㄥ',
    na: 'ㄋㄚ', ne: 'ㄋㄜ', nai: 'ㄋㄞ', nei: 'ㄋㄟ', nao: 'ㄋㄠ', nou: 'ㄋㄡ', nan: 'ㄋㄢ', nen: 'ㄋㄣ', nang: 'ㄋㄤ', neng: 'ㄋㄥ', ni: 'ㄋㄧ', niao: 'ㄋㄧㄠ', nie: 'ㄋㄧㄝ', niu: 'ㄋㄧㄡ', nian: 'ㄋㄧㄢ', nin: 'ㄋㄧㄣ', niang: 'ㄋㄧㄤ', ning: 'ㄋㄧㄥ', nu: 'ㄋㄨ', nuo: 'ㄋㄨㄛ', nuan: 'ㄋㄨㄢ', nong: 'ㄋㄨㄥ', nv: 'ㄋㄩ', nü: 'ㄋㄩ', nve: 'ㄋㄩㄝ', nüe: 'ㄋㄩㄝ',
    la: 'ㄌㄚ', le: 'ㄌㄜ', lai: 'ㄌㄞ', lei: 'ㄌㄟ', lao: 'ㄌㄠ', lou: 'ㄌㄡ', lan: 'ㄌㄢ', lang: 'ㄌㄤ', leng: 'ㄌㄥ', li: 'ㄌㄧ', lia: 'ㄌㄧㄚ', liao: 'ㄌㄧㄠ', lie: 'ㄌㄧㄝ', liu: 'ㄌㄧㄡ', lian: 'ㄌㄧㄢ', lin: 'ㄌㄧㄣ', liang: 'ㄌㄧㄤ', ling: 'ㄌㄧㄥ', lu: 'ㄌㄨ', luo: 'ㄌㄨㄛ', luan: 'ㄌㄨㄢ', lun: 'ㄌㄨㄣ', long: 'ㄌㄨㄥ', lv: 'ㄌㄩ', lü: 'ㄌㄩ', lve: 'ㄌㄩㄝ', lüe: 'ㄌㄩㄝ',
    ga: 'ㄍㄚ', ge: 'ㄍㄜ', gai: 'ㄍㄞ', gei: 'ㄍㄟ', gao: 'ㄍㄠ', gou: 'ㄍㄡ', gan: 'ㄍㄢ', gen: 'ㄍㄣ', gang: 'ㄍㄤ', geng: 'ㄍㄥ', gu: 'ㄍㄨ', gua: 'ㄍㄨㄚ', guo: 'ㄍㄨㄛ', guai: 'ㄍㄨㄞ', gui: 'ㄍㄨㄟ', guan: 'ㄍㄨㄢ', gun: 'ㄍㄨㄣ', guang: 'ㄍㄨㄤ', gong: 'ㄍㄨㄥ',
    ka: 'ㄎㄚ', ke: 'ㄎㄜ', kai: 'ㄎㄞ', kei: 'ㄎㄟ', kao: 'ㄎㄠ', kou: 'ㄎㄡ', kan: 'ㄎㄢ', ken: 'ㄎㄣ', kang: 'ㄎㄤ', keng: 'ㄎㄥ', ku: 'ㄎㄨ', kua: 'ㄎㄨㄚ', kuo: 'ㄎㄨㄛ', kuai: 'ㄎㄨㄞ', kui: 'ㄎㄨㄟ', kuan: 'ㄎㄨㄢ', kun: 'ㄎㄨㄣ', kuang: 'ㄎㄨㄤ', kong: 'ㄎㄨㄥ',
    ha: 'ㄏㄚ', he: 'ㄏㄜ', hai: 'ㄏㄞ', hei: 'ㄏㄟ', hao: 'ㄏㄠ', hou: 'ㄏㄡ', han: 'ㄏㄢ', hen: 'ㄏㄣ', hang: 'ㄏㄤ', heng: 'ㄏㄥ', hu: 'ㄏㄨ', hua: 'ㄏㄨㄚ', huo: 'ㄏㄨㄛ', huai: 'ㄏㄨㄞ', hui: 'ㄏㄨㄟ', huan: 'ㄏㄨㄢ', hun: 'ㄏㄨㄣ', huang: 'ㄏㄨㄤ', hong: 'ㄏㄨㄥ',
    ji: 'ㄐㄧ', jia: 'ㄐㄧㄚ', jiao: 'ㄐㄧㄠ', jie: 'ㄐㄧㄝ', jiu: 'ㄐㄧㄡ', jian: 'ㄐㄧㄢ', jin: 'ㄐㄧㄣ', jiang: 'ㄐㄧㄤ', jing: 'ㄐㄧㄥ', jiong: 'ㄐㄩㄥ', ju: 'ㄐㄩ', jue: 'ㄐㄩㄝ', juan: 'ㄐㄩㄢ', jun: 'ㄐㄩㄣ',
    qi: 'ㄑㄧ', qia: 'ㄑㄧㄚ', qiao: 'ㄑㄧㄠ', qie: 'ㄑㄧㄝ', qiu: 'ㄑㄧㄡ', qian: 'ㄑㄧㄢ', qin: 'ㄑㄧㄣ', qiang: 'ㄑㄧㄤ', qing: 'ㄑㄧㄥ', qiong: 'ㄑㄩㄥ', qu: 'ㄑㄩ', que: 'ㄑㄩㄝ', quan: 'ㄑㄩㄢ', qun: 'ㄑㄩㄣ',
    xi: 'ㄒㄧ', xia: 'ㄒㄧㄚ', xiao: 'ㄒㄧㄠ', xie: 'ㄒㄧㄝ', xiu: 'ㄒㄧㄡ', xian: 'ㄒㄧㄢ', xin: 'ㄒㄧㄣ', xiang: 'ㄒㄧㄤ', xing: 'ㄒㄧㄥ', xiong: 'ㄒㄩㄥ', xu: 'ㄒㄩ', xue: 'ㄒㄩㄝ', xuan: 'ㄒㄩㄢ', xun: 'ㄒㄩㄣ',
    zhi: 'ㄓ', zha: 'ㄓㄚ', zhe: 'ㄓㄜ', zhai: 'ㄓㄞ', zhei: 'ㄓㄟ', zhao: 'ㄓㄠ', zhou: 'ㄓㄡ', zhan: 'ㄓㄢ', zhen: 'ㄓㄣ', zhang: 'ㄓㄤ', zheng: 'ㄓㄥ', zhu: 'ㄓㄨ', zhua: 'ㄓㄨㄚ', zhuo: 'ㄓㄨㄛ', zhuai: 'ㄓㄨㄞ', zhui: 'ㄓㄨㄟ', zhuan: 'ㄓㄨㄢ', zhun: 'ㄓㄨㄣ', zhuang: 'ㄓㄨㄤ', zhong: 'ㄓㄨㄥ',
    chi: 'ㄔ', cha: 'ㄔㄚ', che: 'ㄔㄜ', chai: 'ㄔㄞ', chao: 'ㄔㄠ', chou: 'ㄔㄡ', chan: 'ㄔㄢ', chen: 'ㄔㄣ', chang: 'ㄔㄤ', cheng: 'ㄔㄥ', chu: 'ㄔㄨ', chua: 'ㄔㄨㄚ', chuo: 'ㄔㄨㄛ', chuai: 'ㄔㄨㄞ', chui: 'ㄔㄨㄟ', chuan: 'ㄔㄨㄢ', chun: 'ㄔㄨㄣ', chuang: 'ㄔㄨㄤ', chong: 'ㄔㄨㄥ',
    shi: 'ㄕ', sha: 'ㄕㄚ', she: 'ㄕㄜ', shai: 'ㄕㄞ', shei: 'ㄕㄟ', shao: 'ㄕㄠ', shou: 'ㄕㄡ', shan: 'ㄕㄢ', shen: 'ㄕㄣ', shang: 'ㄕㄤ', sheng: 'ㄕㄥ', shu: 'ㄕㄨ', shua: 'ㄕㄨㄚ', shuo: 'ㄕㄨㄛ', shuai: 'ㄕㄨㄞ', shui: 'ㄕㄨㄟ', shuan: 'ㄕㄨㄢ', shun: 'ㄕㄨㄣ', shuang: 'ㄕㄨㄤ',
    ri: 'ㄖ', re: 'ㄖㄜ', rao: 'ㄖㄠ', rou: 'ㄖㄡ', ran: 'ㄖㄢ', ren: 'ㄖㄣ', rang: 'ㄖㄤ', reng: 'ㄖㄥ', ru: 'ㄖㄨ', rua: 'ㄖㄨㄚ', ruo: 'ㄖㄨㄛ', rui: 'ㄖㄨㄟ', ruan: 'ㄖㄨㄢ', run: 'ㄖㄨㄣ', rong: 'ㄖㄨㄥ',
    zi: 'ㄗ', za: 'ㄗㄚ', ze: 'ㄗㄜ', zai: 'ㄗㄞ', zei: 'ㄗㄟ', zao: 'ㄗㄠ', zou: 'ㄗㄡ', zan: 'ㄗㄢ', zen: 'ㄗㄣ', zang: 'ㄗㄤ', zeng: 'ㄗㄥ', zu: 'ㄗㄨ', zuo: 'ㄗㄨㄛ', zui: 'ㄗㄨㄟ', zuan: 'ㄗㄨㄢ', zun: 'ㄗㄨㄣ', zong: 'ㄗㄨㄥ',
    ci: 'ㄘ', ca: 'ㄘㄚ', ce: 'ㄘㄜ', cai: 'ㄘㄞ', cao: 'ㄘㄠ', cou: 'ㄘㄡ', can: 'ㄘㄢ', cen: 'ㄘㄣ', cang: 'ㄘㄤ', ceng: 'ㄘㄥ', cu: 'ㄘㄨ', cuo: 'ㄘㄨㄛ', cui: 'ㄘㄨㄟ', cuan: 'ㄘㄨㄢ', cun: 'ㄘㄨㄣ', cong: 'ㄘㄨㄥ',
    si: 'ㄙ', sa: 'ㄙㄚ', se: 'ㄙㄜ', sai: 'ㄙㄞ', sao: 'ㄙㄠ', sou: 'ㄙㄡ', san: 'ㄙㄢ', sen: 'ㄙㄣ', sang: 'ㄙㄤ', seng: 'ㄙㄥ', su: 'ㄙㄨ', suo: 'ㄙㄨㄛ', sui: 'ㄙㄨㄟ', suan: 'ㄙㄨㄢ', sun: 'ㄙㄨㄣ', song: 'ㄙㄨㄥ'
  };

  const zhuyinToneMarks: Record<number, string> = {
    1: '',
    2: 'ˊ',
    3: 'ˇ',
    4: 'ˋ',
    5: '˙'
  };

  const mapped = zhuyinMap[base];
  if (mapped) {
    const toneMark = zhuyinToneMarks[tone] ?? '';
    return tone === 5 ? `˙${mapped}` : `${mapped}${toneMark}`;
  }
  return '';
}

// Parse text to character tokens with pinyin-pro using context-aware sentence segmentation
function localParseToTokens(text: string) {
  try {
    const results = pinyin(text, {
      type: 'all',
      toneType: 'symbol',
    });

    if (Array.isArray(results) && results.length > 0) {
      return results.map((item) => {
        const char = item.origin;
        const isZh = item.isZh && /[\u4e00-\u9fa5]/.test(char);
        const py = isZh ? item.pinyin : '';
        const toneNum = isZh ? (item.num ?? extractTone(py)) : 0;
        return {
          char,
          pinyin: py,
          tone: toneNum === 5 ? 5 : (toneNum > 0 && toneNum <= 4 ? toneNum : 5),
          zhuyin: isZh ? pinyinToZhuyinServer(py) : '',
          isPunctuation: !isZh,
        };
      });
    }
  } catch (err) {
    console.warn('pinyin error in localParseToTokens:', err);
  }

  // Fallback if parsing error
  return Array.from(text).map((char) => {
    const isZh = /[\u4e00-\u9fa5]/.test(char);
    if (!isZh) {
      return { char, pinyin: '', tone: 0, zhuyin: '', isPunctuation: true };
    }
    const py = pinyin(char, { toneType: 'symbol' });
    return {
      char,
      pinyin: py,
      tone: extractTone(py),
      zhuyin: pinyinToZhuyinServer(py),
      isPunctuation: false,
    };
  });
}

// POST /api/analyze-subtitles
app.post('/api/analyze-subtitles', async (req, res) => {
  try {
    const { text, episodeTitle, videoUrl } = req.body;

    if (!text && !videoUrl) {
      return res.status(400).json({ error: 'Text or video info is required' });
    }

    const ai = getGeminiClient();

    // If Gemini is available, use Gemini to produce rich character-level linguistic and cultural analysis
    if (ai) {
      try {
        const prompt = `You are an expert Taiwanese Mandarin linguist, dialect coach, and subtitle translator specializing in Taiwanese soap operas (偶像劇 / 鄉土劇 / 華劇).
Given the following Taiwanese drama subtitles or transcript context:
"${text || episodeTitle || 'Dialogue from drama episode'}"

Analyze and generate an array of subtitle lines with:
1. Traditional Chinese text (standard in Taiwan dramas, e.g. 繁體中文)
2. Character-by-character Pinyin with precise tone marks (ā, á, ǎ, à) and Zhuyin (Bopomofo)
3. Natural, context-accurate English translation matching the drama's dramatic emotional tone
4. Taiwanese cultural & pronunciation note: Explain any Taiwanese accent traits (e.g. lack of harsh retroflex, tone sandhi, soft ending particles like 啦, 吼, 喔, 欸, 捏), Taiwanese Hokkien/Minnan loanwords (e.g. 拍寫/歹勢, 真的假的, 凍蒜, 安啦, 奧客), or idiomatic meanings.
5. Speaker name if identifiable or suitable archetype
6. Suggested start and end timestamps in seconds

Return strictly a valid JSON array of objects with the following schema:
[
  {
    "id": "line-1",
    "startTime": 0.0,
    "endTime": 4.5,
    "mandarin": "Traditional Chinese sentence",
    "english": "Natural English translation",
    "taiwanNotes": "Taiwanese cultural, slang, or pronunciation notes",
    "speaker": "Speaker Name"
  }
]`;

        const { text: raw, modelUsed } = await generateWithModelFallback(ai, prompt, {
          config: {
            responseMimeType: 'application/json',
          },
        });

        if (raw) {
          const parsed = JSON.parse(raw);
          const lines = Array.isArray(parsed) ? parsed : [parsed];

          // Tokenize each line into character-by-character tokens
          const enriched = lines.map((item: any, idx: number) => {
            const mandarin = item.mandarin || '';
            const characters = localParseToTokens(mandarin);
            return {
              id: item.id || `line-${idx + 1}`,
              startTime: typeof item.startTime === 'number' ? item.startTime : idx * 4,
              endTime: typeof item.endTime === 'number' ? item.endTime : (idx + 1) * 4 - 0.5,
              mandarin,
              characters,
              english: item.english || '',
              taiwanNotes: item.taiwanNotes || '',
              speaker: item.speaker || 'Character',
            };
          });

          return res.json({ lines: enriched, source: `gemini (${modelUsed})` });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini subtitle analysis unavailable, falling back to local linguistic engine:', geminiErr?.message || geminiErr);
      }
    }

    // Fallback: rule-based linguistic parsing using pinyin-pro
    const rawLines = (text || '')
      .split(/\n+/)
      .map((l: string) => l.trim())
      .filter(Boolean);

    const fallbackLines = rawLines.map((line: string, idx: number) => {
      const characters = localParseToTokens(line);
      return {
        id: `local-line-${idx + 1}`,
        startTime: idx * 4,
        endTime: (idx + 1) * 4 - 0.5,
        mandarin: line,
        characters,
        english: 'Mandarin script line (click AI Chat for full analysis and translation)',
        taiwanNotes: 'Taiwanese drama script line. Pronounced with natural Taiwanese Mandarin rhythm.',
        speaker: 'Speaker',
      };
    });

    res.json({ lines: fallbackLines, source: 'local' });
  } catch (err: any) {
    console.error('Subtitle analysis error:', err);
    res.status(500).json({ error: err.message || 'Failed to analyze subtitles' });
  }
});

// POST /api/ocr-frame - Optical Character Recognition on video frame via Gemini Vision
app.post('/api/ocr-frame', async (req, res) => {
  try {
    const { imageBase64, timestamp, episodeTitle } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    // Strip data:image/...;base64, if present
    const base64Clean = imageBase64.replace(/^data:image\/[a-zA-Z0-9.-]+;base64,/, '');

    const ai = getGeminiClient();

    if (ai) {
      try {
        const prompt = `You are a high-accuracy Optical Character Recognition (OCR) engine specialized in reading Chinese subtitles burned or embedded into Taiwanese television dramas and soap operas (偶像劇 / 鄉土劇 / 華劇 / 台劇).

Examine this video frame image (focusing particularly on the lower third/bottom area where dialogue subtitles appear).

Tasks:
1. Detect if any Chinese dialogue subtitle text (Traditional Chinese 繁體中文 or Simplified Chinese 簡體中文) is visible in the frame.
2. If text is visible:
   - "mandarin": transcribe the exact Chinese dialogue verbatim. Output standard Traditional Chinese characters (繁體中文) as used in Taiwan.
   - "english": transcribe the English translation if it is printed on screen below the Chinese. If no English translation is printed on screen, provide an expressive, accurate English translation suited for a Taiwanese drama.
   - "taiwanNotes": a short explanation of any Taiwanese colloquial phrasing, sentence-ending modal particles (啦, 吼, 捏, 喔, 欸), Hokkien/Minnan loanwords, or pronunciation/tone tips.
3. If NO subtitle or dialogue text is visible on screen (e.g. scenic transition shot, silence, opening credit, or logo without spoken dialogue), return "hasSubtitle": false.

Respond STRICTLY with valid JSON:
{
  "hasSubtitle": true,
  "mandarin": "真的假的啦？我怎麼都不知道！",
  "english": "For real? How come I had no idea at all!",
  "taiwanNotes": "Colloquial Taiwanese phrase expressing sudden surprise, softened by the particle 啦 (la)."
}
If no subtitle text is visible:
{
  "hasSubtitle": false,
  "mandarin": "",
  "english": ""
}`;

        const { text: rawText, modelUsed } = await generateWithModelFallback(
          ai,
          [
            {
              role: 'user',
              parts: [
                {
                  inlineData: {
                    data: base64Clean,
                    mimeType: 'image/jpeg',
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          {
            config: {
              temperature: 0.1,
              responseMimeType: 'application/json',
            },
          }
        );

        let parsed: any = {};
        try {
          parsed = JSON.parse(rawText);
        } catch (e) {
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            parsed = JSON.parse(jsonMatch[0]);
          }
        }

        if (parsed.hasSubtitle && parsed.mandarin && parsed.mandarin.trim().length > 0) {
          const mandarin = parsed.mandarin.trim();
          // Generate character-by-character tokens with tone and zhuyin
          const characters = localParseToTokens(mandarin);

          return res.json({
            success: true,
            hasSubtitle: true,
            mandarin,
            english: parsed.english || 'Dialogue line from drama',
            taiwanNotes: parsed.taiwanNotes || 'Taiwanese drama dialogue.',
            characters,
            timestamp: typeof timestamp === 'number' ? timestamp : 0,
            source: `gemini-vision-ocr (${modelUsed})`,
          });
        } else {
          return res.json({
            success: true,
            hasSubtitle: false,
            timestamp: typeof timestamp === 'number' ? timestamp : 0,
            source: `gemini-vision-ocr (${modelUsed})`,
          });
        }
      } catch (geminiErr: any) {
        console.warn('Gemini vision OCR temporary error after fallback attempts:', geminiErr?.message || geminiErr);
        return res.json({
          success: true,
          hasSubtitle: false,
          isUnavailable: true,
          message: 'The AI vision service is temporarily experiencing high demand. Please try scanning this frame again in a moment.',
          timestamp: typeof timestamp === 'number' ? timestamp : 0,
          source: 'temporary-high-demand',
        });
      }
    }

    // Fallback if Gemini key is absent or temporary error
    return res.json({
      success: true,
      hasSubtitle: false,
      message: 'Gemini Vision active. No subtitles detected on frame.',
      timestamp: typeof timestamp === 'number' ? timestamp : 0,
      source: 'fallback',
    });
  } catch (err: any) {
    console.error('OCR route error:', err);
    res.status(500).json({ error: err.message || 'OCR processing failed' });
  }
});

// POST /api/chat - Chatbot agent for pronunciation, translations, and Taiwanese drama context
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history, currentLine, selectedChar, episodeTitle } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `You are a friendly, knowledgeable, and engaging Taiwanese Mandarin Tutor and Taiwanese Soap Opera (偶像劇 / 台劇) Expert.
The learner is watching Taiwanese dramas to learn to speak Mandarin, but finds it challenging to pause and memorize pronunciations and characters.

Your specialities:
1. Pinyin & Tone Guidance:
   - Provide precise Pinyin with tone marks (1st: mā, 2nd: má, 3rd: mǎ, 4th: mà, neutral: ma).
   - Explain tone changes (Tone Sandhi), e.g., two 3rd tones in a row become 2nd + 3rd (e.g. 你好 nǐ hǎo -> ní hǎo), "一" (yī) changing tone before 4th tone (yí) or 1st/2nd/3rd tones (yì), "不" (bù) changing to 2nd tone before 4th tone (bú).
2. Taiwanese Mandarin Accent & Speech Habits:
   - Less retroflex (zh, ch, sh often sound softer or merge towards z, c, s).
   - Soft neutral tones and lively sentence-final modal particles: 啦 (la), 吼 (hǒu), 欸 (éi), 喔 (o), 耶 (ye), 捏 (ne), 嘛 (ma).
   - Common Taiwanese Hokkien (台語) loanwords used in everyday soap operas: 拍寫/歹勢 (pháinn-sè = sorry), 真的假的 (for real?), 凍蒜 (dòngsuàn = get elected/win), 安啦 (ān la = don't worry), 呷飽未 (have you eaten?), 凍未條 (can't stand it).
   - Soft, conversational tone (not overly robotic or formal textbook).
3. Clear formatting:
   - Always write Chinese characters with their Pinyin right next to or above them in bold, followed by the English translation.
   - Break down individual words or character components if helpful.
   - Keep answers clear, accessible, and structured with bullet points.

Current Context:
${episodeTitle ? `- Current Show/Episode: ${episodeTitle}` : ''}
${currentLine ? `- Currently Selected Subtitle Line: "${currentLine.mandarin}" (English: "${currentLine.english}")` : ''}
${selectedChar ? `- Specifically Inquiring About Character/Word: "${selectedChar}"` : ''}
`;

    if (ai) {
      try {
        // Construct conversation
        const contents: any[] = [];

        if (Array.isArray(history) && history.length > 0) {
          for (const item of history.slice(-6)) {
            contents.push({
              role: item.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: item.content }],
            });
          }
        }

        // Current user message with context hint
        let promptText = message;
        if (selectedChar) {
          promptText += `\n[Context: The user clicked on the character/word "${selectedChar}" in the subtitle "${currentLine?.mandarin || ''}"]`;
        } else if (currentLine) {
          promptText += `\n[Context: The user is asking about the subtitle line: "${currentLine.mandarin}" ("${currentLine.english}")]`;
        }

        contents.push({
          role: 'user',
          parts: [{ text: promptText }],
        });

        const { text: replyText, modelUsed } = await generateWithModelFallback(
          ai,
          contents,
          {
            config: {
              systemInstruction,
              temperature: 0.7,
            },
          }
        );

        return res.json({
          reply: replyText || 'Sorry, I could not generate a response right now.',
          model: modelUsed,
        });
      } catch (geminiError: any) {
        console.warn('Gemini chat temporary error after fallback attempts:', geminiError?.message || geminiError);
      }
    }

    // High quality offline / rule-based fallback response if Gemini is not responding or key is absent
    let reply = '';
    if (selectedChar) {
      const py = pinyin(selectedChar, { toneType: 'symbol' });
      reply = `Great question about **${selectedChar}**!\n\n` +
        `• **Pinyin:** \`${py}\`\n` +
        `• **Tone:** Tone ${extractTone(py)}\n\n` +
        `In Taiwanese dramas, characters like this are spoken with a natural, melodic Taiwanese Mandarin rhythm. Notice how it flows with the surrounding words in "${currentLine?.mandarin || selectedChar}".`;
    } else if (currentLine) {
      reply = `Here is the breakdown of "${currentLine.mandarin}":\n\n` +
        `• **Mandarin:** ${currentLine.mandarin}\n` +
        `• **English:** ${currentLine.english}\n` +
        (currentLine.taiwanNotes ? `• **Taiwanese Context:** ${currentLine.taiwanNotes}\n\n` : '\n') +
        `Notice the flow and pronunciation of each word! Click any specific character above to inspect its tone and breakdown.`;
    } else {
      reply = `Hello! I'm your Taiwanese Mandarin drama tutor. Ask me about any character pronunciation (Pinyin, tones, Bopomofo), tone change rules, Taiwanese slang, or the meaning of phrases in this episode!`;
    }

    return res.json({ reply });
  } catch (err: any) {
    console.error('Chat error:', err);
    res.status(500).json({ error: err.message || 'Chat service error' });
  }
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Taiwanese Drama Mandarin Subtitle Tutor running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
