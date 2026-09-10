// Deliberately bounded mappings, keyed by font and legacy byte code. Do not
// treat private-use characters as universal bullets or conflate font families.
// Symbol: https://www.unicode.org/Public/MAPPINGS/VENDORS/ADOBE/symbol.txt
// Wingdings/Webdings: https://www.unicode.org/wg2/docs/n4363.pdf, source refs.
// Windows symbol fonts encode legacy bytes at U+F000 + byte:
// https://learn.microsoft.com/en-us/typography/opentype/otspec183/recom
const LIST_GLYPHS: Readonly<Record<string, Readonly<Record<number, string>>>> = {
  symbol: { 0x2d: '\u2212', 0x6f: '\u03bf', 0xa7: '\u2663', 0xa8: '\u2666', 0xab: '\u2194', 0xac: '\u2190', 0xad: '\u2191', 0xae: '\u2192', 0xaf: '\u2193', 0xb7: '\u2022' },
  wingdings: { 0x6c: '\u26ab', 0x6e: '\u25fc', 0x75: '\u25c6', 0x9f: '\u2022', 0xa7: '\u25aa', 0xab: '\u2605', 0xfc: '\u2713' },
  'wingdings 2': { 0x52: '\u2611' },
  webdings: { 0x61: '\u2714' }
};

export const hasPrivateUse = (text: string): boolean => /[\uE000-\uF8FF\u{F0000}-\u{FFFFD}\u{100000}-\u{10FFFD}]/u.test(text);

/** Convert only verified font codes; ordinary Unicode labels remain literal. */
export function resolveBulletLabel(text: string, font?: string): string {
  const family = font?.trim().toLowerCase();
  const mapping = family === undefined ? undefined : LIST_GLYPHS[family];
  const legacyFont = mapping !== undefined || family === 'wingdings 3';
  return Array.from(text, character => {
    const code = character.codePointAt(0)!;
    const legacyCode = code >= 0xf020 && code <= 0xf0ff ? code - 0xf000 : code;
    if (legacyFont && legacyCode >= 0x20 && legacyCode <= 0xff) {
      if (legacyCode === 0x20) return ' ';
      const mapped = mapping?.[legacyCode];
      if (mapped !== undefined) return mapped;
      throw new Error(`Unmapped list glyph U+${code.toString(16).toUpperCase()} in ${font}.`);
    }
    if (hasPrivateUse(character)) throw new Error(`Font-specific list glyph U+${code.toString(16).toUpperCase()} needs a verified font mapping (${font ?? 'font unspecified'}).`);
    return character;
  }).join('');
}

/** Word repeats the same letter after z: aa, bb ... zz, aaa ... */
export function formatNumber(number: number, format: string): string {
  if (!Number.isSafeInteger(number) || number < 0 || number > 2147483647) throw new Error('Number outside supported range.');
  switch (format) {
    case 'decimal': return String(number);
    case 'decimalZero': return String(number).padStart(2, '0');
    case 'none': return '';
    case 'lowerLetter':
    case 'upperLetter': {
      if (number < 1 || number > 26 * 100) throw new Error('Letter numbering outside validated range (1–2600).');
      const base = format === 'lowerLetter' ? 97 : 65;
      return String.fromCharCode(base + (number - 1) % 26).repeat(Math.floor((number - 1) / 26) + 1);
    }
    case 'lowerRoman':
    case 'upperRoman': {
      if (number < 1 || number > 3999) throw new Error('Roman numbering outside validated range (1–3999).');
      const symbols: Array<[number, string]> = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
      let result = '';
      for (const [amount, symbol] of symbols) {
        while (number >= amount) { result += symbol; number -= amount; }
      }
      return format === 'lowerRoman' ? result.toLowerCase() : result;
    }
    default: throw new Error(`Unsupported number format: ${format}`);
  }
}
