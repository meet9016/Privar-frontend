// High Quality English to Gujarati Phonetic Transliterator Engine

const gujaratiWordMap = {
  // Cities, towns & regions
  'radhanpur': 'રાધનપુર',
  'radhan': 'રાધનપુર',
  'patan': 'પાટણ',
  'paton': 'પાટણ',
  'mehsana': 'મહેસાણા',
  'mahesana': 'મહેસાણા',
  'sidhpur': 'સિદ્ધપુર',
  'siddhpur': 'સિદ્ધપુર',
  'chapi': 'છાપી',
  'kanodar': 'કાનોદર',
  'palanpur': 'પાલનપુર',
  'deesa': 'ડીસા',
  'disa': 'ડીસા',
  'thara': 'થરા',
  'tharadi': 'થરાડી',
  'bhabhar': 'ભાભર',
  'dhanera': 'ધાનેરા',
  'vav': 'વાવ',
  'santalpur': 'સાંતલપુર',
  'sami': 'સમી',
  'harij': 'હારીજ',
  'chanasma': 'ચાણસ્મા',
  'varahi': 'વારાહી',
  'adisar': 'આદિસર',
  'bhuj': 'ભુજ',
  'gandhidham': 'ગાંધીધામ',
  'morbi': 'મોરબી',
  'rajkot': 'રાજકોટ',
  'ahmedabad': 'અમદાવાદ',
  'amdavad': 'અમદાવાદ',
  'surat': 'સુરત',
  'vadodara': 'વડોદરા',
  'baroda': 'વડોદરા',
  'bhavnagar': 'ભાવનગર',
  'jamnagar': 'જામનગર',
  'gandhinagar': 'ગાંધીનગર',
  'unjha': 'ઊંઝા',
  'kadi': 'કડી',
  'kalol': 'કલોલ',

  // Common Certificate Terms
  'memon': 'મેમન',
  'jamat': 'જમાઅત',
  'jamaat': 'જમાઅત',
  'kazi': 'કાઝી',
  'saheb': 'સાહેબ',
  'dulha': 'દુલ્હા',
  'dulhan': 'દુલ્હન',
  'pita': 'પિતા',
  'vakil': 'વકીલ',
  'sakshi': 'સાક્ષી',
  'gam': 'ગામ',
  'gaam': 'ગામ',
  'village': 'ગામ',
  'maher': 'મહેર',
  'rakam': 'રકમ',
  'gram': 'ગ્રામ',
  'sonu': 'સોનું',
  'mohar': 'મોહર',
  'sahi': 'સહી',
  'sign': 'સહી',
  'pramukh': 'પ્રમુખ',
  'secretary': 'સેક્રેટરી',
  'nikah': 'નિકાહ',
  'nama': 'નામા',
  'bismillah': 'બિસ્મિહી',
  'taala': 'તઆલા',
  'trust': 'ટ્રસ્ટ',
  'number': 'નંબર',
  'no': 'નં.',
  'tarikh': 'તારીખ',
  'date': 'તારીખ',
  'janaab': 'જનાબ',
  'janab': 'જનાબ',
  'rehvasi': 'રહેવાસી',
  'rehvaasi': 'રહેવાસી',
  'dikro': 'દીકરો',
  'dikri': 'દીકરી',
  'muqam': 'મુકામ',
  'taluka': 'તાલુકો',
  'taluko': 'તાલુકો',
  'jilla': 'જીલ્લો',
  'jila': 'જી.',
  'ji': 'જી.',
  'hal': 'હાલે',
  'hale': 'હાલે',
  'aasam': 'આસામી',
  'aasami': 'આસામી',
  'salam': 'સલામ',
  'assalam': 'અસ્સલામો',
  'alaykum': 'અલયકુમ',
  'insha': 'ઇન્શા',
  'allah': 'અલ્લાહ',
  'parvangi': 'પરવાનગી',
  'program': 'પ્રોગ્રામ',
  'niyam': 'નિયમો',
  'shadi': 'શાદી',
  'bandharan': 'બંધારણ',
  'faraj': 'ફરજ',
  'naitik': 'નૈતિક',
  'takrar': 'તકરાર',
  'vandho': 'વાંધો',
  'leynu': 'લ્હેણું',
  'baki': 'બાકી',

  // Days of week
  'somvar': 'સોમવાર',
  'mangalvar': 'મંગળવાર',
  'budhvar': 'બુધવાર',
  'guruvar': 'ગુરુવાર',
  'shukravar': 'શુક્રવાર',
  'shanivar': 'શનિવાર',
  'ravivar': 'રવિવાર',
  'sunday': 'રવિવાર',
  'monday': 'સોમવાર',
  'tuesday': 'મંગળવાર',
  'wednesday': 'બુધવાર',
  'thursday': 'ગુરુવાર',
  'friday': 'શુક્રવાર',
  'saturday': 'શનિવાર',

  // Months
  'january': 'જાન્યુઆરી',
  'february': 'ફેબ્રુઆરી',
  'march': 'માર્ચ',
  'april': 'એપ્રિલ',
  'may': 'મે',
  'june': 'જૂન',
  'july': 'જુલાઈ',
  'august': 'ઓગસ્ટ',
  'september': 'સપ્ટેમ્બર',
  'october': 'ઓક્ટોબર',
  'november': 'નવેમ્બર',
  'december': 'ડિસેમ્બર',

  // Common Names
  'mohammad': 'મોહમ્મદ',
  'mohammed': 'મોહમ્મદ',
  'muhammad': 'મુહમ્મદ',
  'ahmed': 'અહમદ',
  'ahmad': 'અહમદ',
  'ali': 'અલી',
  'iqbal': 'ઇકબાલ',
  'faruk': 'ફારુક',
  'farooq': 'ફારૂક',
  'imran': 'ઇમરાન',
  'asif': 'આસિફ',
  'salim': 'સલીમ',
  'saleem': 'સલીમ',
  'rafik': 'રફીક',
  'shabbir': 'શબ્બીર',
  'firoz': 'ફિરોઝ',
  'ayub': 'અયુબ',
  'yusuf': 'યુસુફ',
  'ismail': 'ઇસ્માઇલ',
  'ibrahim': 'ઇબ્રાહીમ',
  'altaf': 'અલ્તાફ',
  'rashid': 'રાશીદ',
  'sajid': 'સાજીદ',
  'irfan': 'ઇરફાન',
  'sohel': 'સોહેલ',
  'sohail': 'સોહેલ',
  'rizwan': 'રિઝવાન',
  'bilal': 'બિલાલ',
  'sameer': 'સમીર',
  'nissar': 'નિસાર',
  'nisar': 'નિસાર',
  'yunus': 'યુનુસ',
  'zubair': 'ઝુબેર',
  'fatima': 'ફાતિમા',
  'ayesha': 'આયેશા',
  'amina': 'અમીના',
  'khadija': 'ખદીજા',
  'mariyam': 'મરિયમ',
  'maryam': 'મરિયમ',
  'shabana': 'શબાના',
  'rubina': 'રૂબીના',
  'yasmin': 'યાસ્મીન',
  'nargis': 'નરગીસ',
  'parveen': 'પરવીન',
  'rukshana': 'રૂખસાના',
  'ruksana': 'રૂખસાના',
  'salma': 'સલમા',
  'samim': 'શમીમ',
  'shamim': 'શમીમ',
  'taslim': 'તસ્લીમ',
  'sumaiya': 'સુમૈય્યા',
  'sultana': 'સુલતાના',
  'rehana': 'રેહાના',
  'naseem': 'નસીમ',
  'farhana': 'ફરહાના',
  'abdul': 'અબ્દુલ',
  'kader': 'કાદર',
  'kadir': 'કાદિર',
  'karim': 'કરીમ',
  'latif': 'લતીફ',
  'rashida': 'રાશીદા',
  'nasir': 'નાસિર',
  'zakir': 'ઝાકીર',
  'shakir': 'શાકીર',
  'arbaaz': 'અરબાઝ',
  'saif': 'સૈફ',
  'zahir': 'ઝહીર',
  'mustak': 'મુસ્તાક',
  'mustafa': 'મુસ્તફા',
  'habib': 'હબીબ',
  'hanif': 'હનીફ',
  'harun': 'હારૂન',
  'hamid': 'હામિદ',
  'hasan': 'હસન',
  'hussain': 'હુસૈન',
  'usman': 'ઉસ્માન',
  'osman': 'ઓસ્માન',
  'umar': 'ઉમર',
  'babu': 'બાબુ',
  'bhai': 'ભાઈ',
  'ben': 'બેન',
  'bahen': 'બહેન',
  'khan': 'ખાન',
  'shah': 'શાહ',
  'patel': 'પટેલ',
  'sheikh': 'શેખ',
  'ansari': 'અન્સારી',
  'sayyed': 'સૈયદ',
  'saiyad': 'સૈયદ',
  'quraishi': 'કુરેશી',
  'kureshi': 'કુરેશી',
  'chavda': 'ચાવડા',
  'parmar': 'પરમાર',
  'solanki': 'સોલંકી',
  'vaghela': 'વાઘેલા',
  'rathod': 'રાઠોડ',
}

// Multi-character consonant patterns sorted by length descending
const consonantMap = [
  { eng: 'ksh', guj: 'ક્ષ' },
  { eng: 'shh', guj: 'ષ' },
  { eng: 'chh', guj: 'છ' },
  { eng: 'gnh', guj: 'જ્ઞ' },
  { eng: 'gya', guj: 'જ્ઞ' },
  { eng: 'kh', guj: 'ખ' },
  { eng: 'gh', guj: 'ઘ' },
  { eng: 'ch', guj: 'ચ' },
  { eng: 'jh', guj: 'ઝ' },
  { eng: 'th', guj: 'થ' },
  { eng: 'dh', guj: 'ધ' },
  { eng: 'ph', guj: 'ફ' },
  { eng: 'bh', guj: 'ભ' },
  { eng: 'sh', guj: 'શ' },
  { eng: 'gn', guj: 'જ્ઞ' },
  { eng: 'gy', guj: 'જ્ઞ' },
  { eng: 'k', guj: 'ક' },
  { eng: 'g', guj: 'ગ' },
  { eng: 'j', guj: 'જ' },
  { eng: 'z', guj: 'ઝ' },
  { eng: 't', guj: 'ત' },
  { eng: 'd', guj: 'દ' },
  { eng: 'n', guj: 'ન' },
  { eng: 'p', guj: 'પ' },
  { eng: 'f', guj: 'ફ' },
  { eng: 'b', guj: 'બ' },
  { eng: 'm', guj: 'મ' },
  { eng: 'y', guj: 'ય' },
  { eng: 'r', guj: 'ર' },
  { eng: 'l', guj: 'લ' },
  { eng: 'v', guj: 'વ' },
  { eng: 'w', guj: 'વ' },
  { eng: 's', guj: 'સ' },
  { eng: 'h', guj: 'હ' },
  { eng: 'c', guj: 'ક' },
  { eng: 'q', guj: 'ક' },
  { eng: 'x', guj: 'ક્ષ' },
]

// Dependent vowel matras (attached to consonant)
const matraMap = [
  { eng: 'aai', guj: 'ાઈ' },
  { eng: 'aau', guj: 'ાઉ' },
  { eng: 'aan', guj: 'ાં' },
  { eng: 'aam', guj: 'ાં' },
  { eng: 'aa', guj: 'ા' },
  { eng: 'ee', guj: 'ી' },
  { eng: 'oo', guj: 'ૂ' },
  { eng: 'ai', guj: 'ૈ' },
  { eng: 'ay', guj: 'ય' },
  { eng: 'au', guj: 'ૌ' },
  { eng: 'ou', guj: 'ૌ' },
  { eng: 'am', guj: 'ં' },
  { eng: 'an', guj: 'ં' },
  { eng: 'a', guj: 'ા' }, // Default vowel 'a' in names
  { eng: 'i', guj: 'િ' },
  { eng: 'u', guj: 'ુ' },
  { eng: 'e', guj: 'ે' },
  { eng: 'o', guj: 'ો' },
]

// Independent vowels (start of word or after another vowel)
const vowelMap = [
  { eng: 'aaa', guj: 'આ' },
  { eng: 'aai', guj: 'આઈ' },
  { eng: 'aau', guj: 'આઉ' },
  { eng: 'aan', guj: 'આં' },
  { eng: 'aam', guj: 'આં' },
  { eng: 'aa', guj: 'આ' },
  { eng: 'ee', guj: 'ઈ' },
  { eng: 'oo', guj: 'ઊ' },
  { eng: 'ai', guj: 'ઐ' },
  { eng: 'au', guj: 'ઔ' },
  { eng: 'ou', guj: 'ઔ' },
  { eng: 'am', guj: 'અં' },
  { eng: 'an', guj: 'અં' },
  { eng: 'a', guj: 'અ' },
  { eng: 'i', guj: 'ઇ' },
  { eng: 'u', guj: 'ઉ' },
  { eng: 'e', guj: 'એ' },
  { eng: 'o', guj: 'ઓ' },
]

const digitMap = {
  '0': '૦', '1': '૧', '2': '૨', '3': '૩', '4': '૪',
  '5': '૫', '6': '૬', '7': '૭', '8': '૮', '9': '૯'
}

function transliterateWord(word) {
  if (!word) return ''
  const lower = word.toLowerCase()

  // 1. Direct Dictionary Match
  if (gujaratiWordMap[lower]) {
    return gujaratiWordMap[lower]
  }

  // 2. Phonetic Character-by-Character Parser
  let result = ''
  let i = 0
  const len = lower.length

  while (i < len) {
    const ch = lower[i]

    // Digits
    if (digitMap[ch]) {
      result += digitMap[ch]
      i++
      continue
    }

    // Match Consonants
    let matchedCons = null
    let consLen = 0

    for (const c of consonantMap) {
      if (lower.startsWith(c.eng, i)) {
        matchedCons = c.guj
        consLen = c.eng.length
        break
      }
    }

    if (matchedCons) {
      i += consLen
      result += matchedCons

      // Check if followed by vowel/matra
      let matchedMatra = null
      let matraLen = 0

      for (const m of matraMap) {
        if (lower.startsWith(m.eng, i)) {
          matchedMatra = m.guj
          matraLen = m.eng.length
          break
        }
      }

      if (matchedMatra) {
        if (matchedMatra === 'ા' && matraLen === 1) {
          // If followed by another consonant in middle of word, skip adding extra 'aa' matra
          if (i + 1 < len) {
            let nextIsCons = consonantMap.some(c => lower.startsWith(c.eng, i + 1))
            if (nextIsCons) {
              i += 1
              continue
            }
          }
        }
        result += matchedMatra
        i += matraLen
      }
      continue
    }

    // Match Independent Vowels
    let matchedVowel = null
    let vowLen = 0

    for (const v of vowelMap) {
      if (lower.startsWith(v.eng, i)) {
        matchedVowel = v.guj
        vowLen = v.eng.length
        break
      }
    }

    if (matchedVowel) {
      result += matchedVowel
      i += vowLen
      continue
    }

    // Non-alphabet symbols
    result += word[i]
    i++
  }

  return result
}

// English to Gujarati Digits mapping
const gujaratiDigitsMap = {
  '0': '૦',
  '1': '૧',
  '2': '૨',
  '3': '૩',
  '4': '૪',
  '5': '૫',
  '6': '૬',
  '7': '૭',
  '8': '૮',
  '9': '૯'
}

// Gujarati to English Digits mapping
const englishDigitsMap = {
  '૦': '0',
  '૧': '1',
  '૨': '2',
  '૩': '3',
  '૪': '4',
  '૫': '5',
  '૬': '6',
  '૭': '7',
  '૮': '8',
  '૯': '9'
}

export function toEnglishDigits(text) {
  if (text === null || text === undefined) return ''
  return String(text).replace(/[૦-૯]/g, digit => englishDigitsMap[digit] || digit)
}

export function toGujaratiDigits(text) {
  if (text === null || text === undefined) return ''
  return String(text).replace(/[0-9]/g, digit => gujaratiDigitsMap[digit] || digit)
}

export function toGujarati(text) {
  if (!text) return ''
  // Split by whitespace and common punctuation, preserving separators
  const parts = text.split(/(\s+|[.,/\\!@#$%^&*()_\-+={}[\]:;"'<>?|])/g)
  return parts.map(part => {
    if (/^(\s+|[.,/\\!@#$%^&*()_\-+={}[\]:;"'<>?|])$/.test(part)) {
      return part
    }
    // If the word contains digits, keep digits in English
    if (/^[0-9]+$/.test(part)) {
      return part
    }
    return transliterateWord(part)
  }).join('')
}
