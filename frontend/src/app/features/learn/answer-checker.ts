export interface AnswerSubject {
  id: string; kind: 'radical' | 'kanji' | 'vocabulary'; meaning: string;
  readings: string[]; otherReadings?: string[];
}
export interface AnswerResult {
  status: 'correct' | 'incorrect' | 'retry'; message: string; accepted: string[];
  origin?: 'source' | 'curated' | 'personal';
}

// Original, deliberately small additions to the catalog's English glosses.
export const MEANING_ALIASES: Readonly<Record<string, readonly string[]>> = {
  'k:大': ['large'], 'k:小': ['little'], 'k:人': ['human'],
  'k:休': ['take a rest'], 'k:見': ['look', 'look at'], 'k:車': ['automobile']
};
const POS = /\[(?:n|adj|adv|v|v\.t|v\.i|pron|pref|suf)\.?\]|\((?:n|adj|adv|v|v\.t|v\.i|pron|pref|suf)\.?\)/gi;

export function normalizeMeaning(value: string): string {
  return value.normalize('NFKC').toLowerCase().replace(POS, '').replace(/[’‘]/g, "'")
    .replace(/[‐‑–—-]/g, ' ').replace(/&/g, ' and ').replace(/[^\p{L}\p{M}\p{N}' ]/gu, ' ')
    .trim().replace(/\s+/g, ' ').replace(/^(?:to|an?|the)\s+/, '');
}

/** Split alternatives only outside annotations: commas inside a qualifier are not answers. */
export function sourceMeanings(meaning: string): string[] {
  const pieces: string[] = []; let current = '', depth = 0;
  for (const c of meaning.normalize('NFKC')) {
    if (c === '(' || c === '[') depth++;
    if (!depth && /[,;/]/.test(c)) { pieces.push(current); current = ''; } else current += c;
    if (c === ')' || c === ']') depth = Math.max(0, depth - 1);
  }
  pieces.push(current);
  return pieces.flatMap(piece => {
    const full = piece.replace(POS, '').trim();
    if (!full || /^(?:noun|verb) suffix$/i.test(full)) return [];
    const bare = full.replace(/\([^)]*\)|\[[^\]]*\]/g, '').trim();
    // Keep a meaningful qualifier on generic verbs, e.g. "be (alive)" is not just "be".
    return bare && (!/^(?:be|do|have|get|make|take|go|come|put)$/i.test(bare) || bare === full) ? [bare] : [full];
  });
}

export function acceptedMeanings(subject: AnswerSubject, personal: readonly string[] = []): string[] {
  const seen = new Set<string>();
  return [...sourceMeanings(subject.meaning), ...(MEANING_ALIASES[subject.id] ?? []), ...personal]
    .filter(value => { const key = normalizeMeaning(value); if (!key || seen.has(key)) return false; seen.add(key); return true; });
}

export function normalizeReading(value: string): string {
  return value.normalize('NFKC').replace(/\s/g, '').replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/ヽ/g, 'ゝ').replace(/ヾ/g, 'ゞ');
}
export function readingAlternatives(values: readonly string[]): string[] {
  return values.flatMap(value => value.split(/[/／、]/)).map(value => value.trim()).filter(Boolean);
}
export function checkReading(answer: string, readings: readonly string[], kind: 'kanji' | 'vocabulary' = 'vocabulary', otherReadings: readonly string[] = []): AnswerResult {
  const accepted = readingAlternatives(readings), input = normalizeReading(answer);
  if (input && accepted.some(value => normalizeReading(value) === input)) return {status: 'correct', message: 'Correct reading.', accepted, origin: 'source'};
  if (!input) return {status: 'incorrect', message: 'Study the listed reading and try it at the next review.', accepted};
  if (!/^[\p{Script=Hiragana}\p{Script=Katakana}ーゝゞ]+$/u.test(input)) return {status: 'retry', message: 'Enter the reading in hiragana or katakana, rather than English, romaji, or kanji. This check has not been scored.', accepted};
  if (kind === 'kanji' && readingAlternatives(otherReadings).some(value => normalizeReading(value) === input)) return {status: 'retry', message: 'That is another listed reading of this kanji. Use the reading taught in this lesson. This check has not been scored.', accepted};
  return {status: 'incorrect', message: kind === 'vocabulary' ? 'That is not a listed whole-word reading. Include the word’s kana endings; small kana and long vowels matter.' : 'That is not a listed lesson reading. Small kana and long vowels matter.', accepted};
}
export function checkAnswer(subject: AnswerSubject, skill: 'meaning' | 'reading', answer: string, personal: readonly string[] = []): AnswerResult {
  if (skill === 'reading') return checkReading(answer, subject.readings, subject.kind === 'kanji' ? 'kanji' : 'vocabulary', subject.otherReadings);
  const accepted = acceptedMeanings(subject, personal), input = normalizeMeaning(answer);
  if (/[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u.test(answer)) return {status: 'retry', message: 'This check asks for the meaning in English, rather than a Japanese reading. It has not been scored.', accepted};
  const sources: ['source' | 'curated' | 'personal', readonly string[]][] = [['source', sourceMeanings(subject.meaning)], ['curated', MEANING_ALIASES[subject.id] ?? []], ['personal', personal]];
  for (const [origin, values] of sources) if (input && values.some(value => normalizeMeaning(value) === input)) return {status: 'correct', message: origin === 'personal' ? 'Accepted your personal meaning synonym.' : 'Correct meaning.', accepted, origin};
  return {status: 'incorrect', message: 'That is not an accepted meaning. Check the listed meanings; spelling is checked exactly.', accepted};
}
