import { pinyin } from 'pinyin-pro';
import { CharacterToken } from '../types';

// Detect tone number from pinyin with tone mark
export function extractToneNumber(pinyinStr: string): number {
  if (!pinyinStr) return 0;
  if (/[āēīōūǖ]/.test(pinyinStr)) return 1;
  if (/[áéíóúǘ]/.test(pinyinStr)) return 2;
  if (/[ǎěǐǒǔǚ]/.test(pinyinStr)) return 3;
  if (/[àèìòùǜ]/.test(pinyinStr)) return 4;
  return 5; // Neutral tone (輕聲)
}

// Remove tone marks to get base pinyin for conversion
export function removeToneMarks(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ü/g, 'v')
    .toLowerCase();
}

// Convert standard pinyin syllable to Taiwanese Zhuyin (Bopomofo 注音符號)
export function pinyinToZhuyin(pinyinWithTone: string): string {
  if (!pinyinWithTone) return '';
  const tone = extractToneNumber(pinyinWithTone);
  let base = removeToneMarks(pinyinWithTone);

  // Common complete syllables mapping table
  const zhuyinMap: Record<string, string> = {
    // Basic initials & vowels
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

// Convert Chinese text to character tokens with aligned pinyin and tone marks
export function parseChineseToTokens(text: string): CharacterToken[] {
  if (!text) return [];

  try {
    const results = pinyin(text, {
      type: 'all',
      toneType: 'symbol',
    });

    if (Array.isArray(results) && results.length > 0) {
      return results.map((item) => {
        const char = item.origin;
        const isChinese = item.isZh && /[\u4e00-\u9fa5]/.test(char);
        const pinyinStr = isChinese ? item.pinyin : '';
        const toneNum = isChinese ? (item.num ?? extractToneNumber(pinyinStr)) : 0;
        const zhuyinStr = isChinese ? pinyinToZhuyin(pinyinStr) : '';

        return {
          char,
          pinyin: pinyinStr,
          tone: toneNum === 5 ? 5 : (toneNum > 0 && toneNum <= 4 ? toneNum : 5),
          zhuyin: zhuyinStr,
          isPunctuation: !isChinese,
        };
      });
    }
  } catch (err) {
    console.warn('pinyin-pro parsing error, falling back:', err);
  }

  // Fallback
  return Array.from(text).map((char) => {
    const isChinese = /[\u4e00-\u9fa5]/.test(char);
    let py = '';
    let tone = 5;
    if (isChinese) {
      try {
        py = pinyin(char, { toneType: 'symbol' });
        tone = extractToneNumber(py);
      } catch {
        py = '';
      }
    }
    return {
      char,
      pinyin: py,
      tone,
      zhuyin: isChinese ? pinyinToZhuyin(py) : '',
      isPunctuation: !isChinese,
    };
  });
}

// Map tone number to color class for visual tone learning
export function getToneColor(tone: number): { text: string; bg: string; border: string } {
  switch (tone) {
    case 1: // 1st tone (high flat, mā) - Rose / Red
      return { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-800' };
    case 2: // 2nd tone (rising, má) - Amber / Orange
      return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800' };
    case 3: // 3rd tone (dipping, mǎ) - Emerald / Green
      return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800' };
    case 4: // 4th tone (falling, mà) - Blue / Indigo
      return { text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800' };
    default: // Neutral tone (light, ma) - Slate / Gray
      return { text: 'text-slate-500 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800/40', border: 'border-slate-200 dark:border-slate-700' };
  }
}
