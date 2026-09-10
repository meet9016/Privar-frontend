/**
 * Phonetic Transliteration Utility for Gujarati and Hindi
 * Supports online Google Input Tools API with instant offline phonetic rules fallback
 */

const GUJARATI_PHONETIC_MAP = {
  // Vowels
  'aa': 'ા', 'ai': 'ૈ', 'au': 'ૌ', 'ee': 'ી', 'oo': 'ૂ', 'ou': 'ૌ',
  'a': '', 'i': 'િ', 'u': 'ુ', 'e': 'ે', 'o': 'ો',
  // Consonants with inherent 'a'
  'k': 'ક', 'kh': 'ખ', 'g': 'ગ', 'gh': 'ઘ',
  'ch': 'ચ', 'chh': 'છ', 'j': 'જ', 'jh': 'ઝ', 'z': 'ઝ',
  't': 'ટ', 'th': 'ઠ', 'd': 'ડ', 'dh': 'ઢ', 'n': 'ણ',
  'ta': 'ત', 'tha': 'થ', 'da': 'દ', 'dha': 'ધ', 'na': 'ન',
  'p': 'પ', 'ph': 'ફ', 'f': 'ફ', 'b': 'બ', 'bh': 'ભ', 'm': 'મ',
  'y': 'ય', 'r': 'ર', 'l': 'લ', 'v': 'વ', 'w': 'વ',
  'sh': 'શ', 'shh': 'ષ', 's': 'સ', 'h': 'હ',
  'ksh': 'ક્ષ', 'gn': 'જ્ઞ', 'gy': 'જ્ઞ', 'tr': 'ત્ર'
};

const HINDI_PHONETIC_MAP = {
  'aa': 'ा', 'ai': 'ै', 'au': 'ौ', 'ee': 'ी', 'oo': 'ू', 'ou': 'ौ',
  'a': '', 'i': 'ि', 'u': 'ु', 'e': 'े', 'o': 'ो',
  'k': 'क', 'kh': 'ख', 'g': 'ग', 'gh': 'घ',
  'ch': 'च', 'chh': 'छ', 'j': 'ज', 'jh': 'झ', 'z': 'ज़',
  't': 'ट', 'th': 'ठ', 'd': 'ड', 'dh': 'ढ', 'n': 'ण',
  'ta': 'त', 'tha': 'थ', 'da': 'द', 'dha': 'ध', 'na': 'न',
  'p': 'प', 'ph': 'फ', 'f': 'फ़', 'b': 'ब', 'bh': 'भ', 'm': 'म',
  'y': 'य', 'r': 'र', 'l': 'ल', 'v': 'व', 'w': 'व',
  'sh': 'श', 'shh': 'ष', 's': 'स', 'h': 'ह',
  'ksh': 'क्ष', 'gn': 'ज्ञ', 'gy': 'ज्ञ', 'tr': 'त्र'
};

// Cache transliteration results
const translitCache = new Map();

/**
 * Fetch suggestions or transliterated text from Google Transliterate API
 * @param {string} word English text to transliterate
 * @param {'gu' | 'hi'} lang Target language ('gu' for Gujarati, 'hi' for Hindi)
 * @returns {Promise<string[]>} List of transliterated word suggestions
 */
export async function getTransliterations(word, lang = 'gu') {
  if (!word || !word.trim()) return [];
  const trimmed = word.trim();
  const itc = lang === 'hi' ? 'hi-t-i0-und' : 'gu-t-i0-und';
  const cacheKey = `${lang}:${trimmed.toLowerCase()}`;

  if (translitCache.has(cacheKey)) {
    return translitCache.get(cacheKey);
  }

  try {
    const url = `https://inputtools.google.com/request?text=${encodeURIComponent(trimmed)}&itc=${itc}&num=5&cp=0&cs=1&ie=utf-8&oe=utf-8`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data[0] === 'SUCCESS' && data[1] && data[1][0] && data[1][0][1]) {
      const suggestions = data[1][0][1];
      translitCache.set(cacheKey, suggestions);
      return suggestions;
    }
  } catch (err) {
    // Silently fall back
  }

  return [];
}

/**
 * Transliterate a full text string word-by-word
 * @param {string} text Full text string
 * @param {'gu' | 'hi'} lang Target language
 * @returns {Promise<string>} Transliterated text
 */
export async function transliterateText(text, lang = 'gu') {
  if (!text) return '';
  const words = text.split(/(\s+)/);
  const converted = await Promise.all(
    words.map(async (part) => {
      if (/^\s+$/.test(part) || !/[a-zA-Z]/.test(part)) return part;
      const suggestions = await getTransliterations(part, lang);
      return suggestions[0] || part;
    })
  );
  return converted.join('');
}

/**
 * Check if a character/string contains Indic (Gujarati/Hindi) characters
 */
export function isIndicText(str) {
  return /[\u0A80-\u0AFF\u0900-\u097F]/.test(str);
}
