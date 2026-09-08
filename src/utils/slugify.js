// Devanagari to Latin phonetic transliteration map
const devanagariMap = {
  // Independent Vowels
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri',
  'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'अं': 'am', 'अः': 'ah',
  
  // Consonants (with implicit 'a' base)
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
  
  // Additional consonants & nukta forms
  'ड़': 'd', 'ढ़': 'dh', 'फ़': 'f', 'ज़': 'z', 'क़': 'q', 'ख़': 'kh', 'ग़': 'gh',
  'ज्ञ': 'gya', 'क्ष': 'ksh', 'त्र': 'tr', 'श्र': 'shr',
  'ड़': 'd', 'ढ़': 'dh', 'फ़': 'f', 'ज़': 'z', 'क़': 'q', 'ख़': 'kh', 'ग़': 'gh',
  
  // Dependent Vowel Signs (Matras)
  'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ँ': 'n', 'ः': 'h',
  
  // Virama / Halant
  '्': '',
  
  // Hindi Numerals
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
};

/**
 * Transliterate Devanagari text to readable Latin phonetic script
 */
export const transliterateHindi = (text) => {
  if (!text) return '';
  let result = '';
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const char = text[i];
    // Check two-char composite or nukta combinations
    const twoChars = i + 1 < len ? char + text[i + 1] : null;
    if (twoChars && devanagariMap[twoChars]) {
      result += devanagariMap[twoChars];
      i++;
      continue;
    }

    if (devanagariMap[char] !== undefined) {
      result += devanagariMap[char];
    } else {
      result += char;
    }
  }
  return result;
};

/**
 * Safe URI decoder that handles malformed percent encoding gracefully
 */
export const safeDecodeURIComponent = (str) => {
  if (!str) return '';
  try {
    return decodeURIComponent(str);
  } catch {
    // If standard decode fails due to single % or malformed seq, clean up
    try {
      return decodeURIComponent(str.replace(/%(?![0-9a-fA-F]{2})/g, '%25'));
    } catch {
      return str;
    }
  }
};

/**
 * Extracts a Firestore document ID from a slug if appended (e.g. "headline-slug-3JDH7Wv6UFHy5LQoPjav")
 * or directly if the param itself is an ID.
 */
export const extractIdFromSlug = (slugOrId) => {
  if (!slugOrId) return null;
  const decoded = safeDecodeURIComponent(slugOrId).trim();
  
  // 1. Direct Firestore ID (alphanumeric 18-28 chars)
  if (/^[a-zA-Z0-9]{18,28}$/.test(decoded)) {
    return decoded;
  }
  
  // 2. Trailing Firestore ID at end of slug after a hyphen
  const match = decoded.match(/-([a-zA-Z0-9]{18,28})$/);
  if (match) {
    return match[1];
  }
  
  return null;
};

/**
 * Clean News URL generator using news title itself (transliterated Latin slug)
 * Example: "rajshamani-become-mentally-dangerous-with-these-habit"
 */
export const createNewsSlug = (title, id) => {
  if (!title && !id) return 'news';
  const transliterated = transliterateHindi(title || '');
  
  let cleanSlug = transliterated
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove special symbols
    .replace(/\s+/g, '-')     // replace spaces with hyphens
    .replace(/-+/g, '-')      // collapse multiple hyphens
    .replace(/^-+|-+$/g, ''); // trim hyphens

  // Allow clean reading length up to 90 characters without breaking mid-word
  if (cleanSlug.length > 90) {
    const truncated = cleanSlug.slice(0, 90);
    const lastHyphen = truncated.lastIndexOf('-');
    cleanSlug = lastHyphen > 30 ? truncated.slice(0, lastHyphen) : truncated;
  }

  if (cleanSlug) {
    return cleanSlug;
  }
  if (id) {
    return id;
  }
  return 'news';
};

/**
 * Backwards compatibility helper
 */
export const getUrlFriendlyTitle = (title) => {
  if (!title) return "";
  return title.replace(/\//g, "-").trim();
};

/**
 * Standard slugify helper
 */
export const slugify = (title) => {
  if (!title) return "";
  const transliterated = transliterateHindi(title);
  return transliterated
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
};
