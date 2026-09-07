import { KanjiCard, ReviewProgress, dueCards } from './kanji-engine';
import { WORD_CONTEXTS } from './word-contexts';

export interface Word {
  id: string; text: string; reading: string; meaning: string;
  prerequisites: string[]; context?: [string, string];
}
export type Exercise = { kind: 'kanji'; card: KanjiCard } | { kind: 'reading' | 'meaning'; word: Word };

export function buildVocabulary(cards: KanjiCard[]): Word[] {
  const words = new Map<string, Word>();
  for (const card of cards) {
    card.examples.forEach(([label, meaning], example) => {
      const match = /^(.+?)（(.+)）$/.exec(label);
      if (!match) return;
      const [, text, reading] = match;
      const id = `${text}:${reading}`;
      if (words.has(id)) return;
      words.set(id, {id, text, reading, meaning, context: WORD_CONTEXTS[text],
        prerequisites: [...new Set(text.match(/\p{Script=Han}/gu) ?? [])]});
    });
  }
  return [...words.values()];
}
export function availableWords(words: Word[], progress: ReviewProgress, assumed: string[] = []): Word[] {
  const familiar = new Set(assumed);
  return words.filter(w => w.prerequisites.every(k => progress[k]?.learned || (!progress[k] && familiar.has(k))));
}
export function wordQueue(words: Word[], progress: ReviewProgress, now: number): Word[] {
  const due = words.filter(w => progress[w.id]?.due <= now).sort((a, b) => progress[a.id].due - progress[b.id].due);
  return [...due, ...words.filter(w => !progress[w.id])];
}
export function mixedQueue(cards: KanjiCard[], kanji: ReviewProgress, words: Word[], vocabulary: ReviewProgress, now: number, assumed: string[] = []): Exercise[] {
  const reviews = dueCards(cards, kanji, now).slice(0, 10);
  const reading = wordQueue(availableWords(words, kanji, assumed), vocabulary, now).slice(0, 10);
  const result: Exercise[] = [];
  for (let i = 0; i < Math.max(reviews.length, reading.length); i++) {
    if (reviews[i]) result.push({kind: 'kanji', card: reviews[i]});
    if (reading[i]) result.push({kind: i % 2 ? 'meaning' : 'reading', word: reading[i]});
  }
  return result;
}
export function readingMatches(answer: string, reading: string): boolean {
  const normalize = (s: string) => s.normalize('NFKC').trim().replace(/\s/g, '').replace(/[ァ-ヶ]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
  return reading.split(/[/／、]/).some(r => normalize(r) === normalize(answer) && normalize(answer) !== '');
}
