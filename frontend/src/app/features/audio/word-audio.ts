import { normalizeReading, readingAlternatives } from '../learn/answer-checker';

export interface AudioWord { id: string; label: string; readings: string[]; }
export interface JapaneseVoice { voiceURI: string; name: string; lang: string; localService: boolean; default: boolean; }
export type WordAudioRate = 1 | 0.75;

/** Speak a published whole-word reading, never guess a reading from a kanji spelling. */
export function audioWord(id: string, label: string, readings: string | readonly string[]): AudioWord | null {
  if (!id || id.length > 200 || !label.trim() || label.length > 200) return null;
  const values = typeof readings === 'string' ? [readings] : readings;
  const valid = [...new Set(readingAlternatives(values).map(normalizeReading))]
    .filter(reading => reading.length > 0 && reading.length <= 100 && /^[\p{Script=Hiragana}\p{Script=Katakana}ーゝゞ]+$/u.test(reading));
  return valid.length ? {id, label, readings: valid} : null;
}
export function japaneseVoice(voices: readonly JapaneseVoice[]): JapaneseVoice | null {
  const candidates = voices.filter(voice => voice.voiceURI && /^ja(?:[-_]|$)/i.test(voice.lang));
  const rank = (voice: JapaneseVoice): number => Number(voice.localService) * 4 + Number(/^ja[-_]jp$/i.test(voice.lang)) * 2 + Number(voice.default);
  return [...candidates].sort((a, b) => rank(b) - rank(a) || (a.voiceURI < b.voiceURI ? -1 : a.voiceURI > b.voiceURI ? 1 : 0))[0] ?? null;
}
