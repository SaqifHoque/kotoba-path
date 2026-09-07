import { KanjiCard, KanjiLevel } from './kanji-curriculum';
export { KanjiCard, KanjiLevel, buildLevels } from './kanji-curriculum';

export interface ReviewState { learned: boolean; stage: number; due: number; attempts: number; }
export type ReviewProgress = Record<string, ReviewState>;
export type Rating = 'again' | 'hard' | 'good';
export const DAY = 86400000;
export const INTERVALS = [1, 3, 7, 14, 30, 60, 120];

export function levelDone(level: KanjiLevel, progress: ReviewProgress): boolean {
  return level.cards.every(c => progress[c.character]?.learned);
}
export function unlocked(levels: KanjiLevel[], index: number, progress: ReviewProgress): boolean {
  return Number.isInteger(index) && index >= 0 && index < levels.length && levels.slice(0, index).every(l => levelDone(l, progress));
}
export function schedule(previous: ReviewState | undefined, rating: Rating, now: number): ReviewState {
  const stage = previous?.stage ?? 0;
  if (rating === 'again') return {learned: previous?.learned ?? false, stage: 0, due: now + 600000, attempts: (previous?.attempts ?? 0) + 1};
  if (rating === 'hard') return {learned: true, stage: Math.max(0, stage - 1), due: now + DAY, attempts: (previous?.attempts ?? 0) + 1};
  return {learned: true, stage: Math.min(stage + 1, INTERVALS.length - 1), due: now + INTERVALS[stage] * DAY, attempts: (previous?.attempts ?? 0) + 1};
}
export function dueCards(cards: KanjiCard[], progress: ReviewProgress, now: number): KanjiCard[] {
  return cards.filter(c => progress[c.character]?.due <= now).sort((a, b) => progress[a.character].due - progress[b.character].due);
}
export function parseProgress(raw: string | null, cards: ReadonlyArray<Pick<KanjiCard, 'character'>>): ReviewProgress {
  if (!raw) return {};
  const value = JSON.parse(raw);
  if (value?.version !== 1 || !value.cards || typeof value.cards !== 'object' || Array.isArray(value.cards)) throw new Error('Invalid progress data');
  const result: ReviewProgress = {};
  for (const card of cards) {
    const p = value.cards[card.character];
    if (p === undefined) continue;
    if (!p || typeof p !== 'object' || Array.isArray(p) || typeof p.learned !== 'boolean' || !Number.isInteger(p.stage) || p.stage < 0 || p.stage >= INTERVALS.length ||
        !Number.isFinite(p.due) || p.due < 0 || !Number.isInteger(p.attempts) || p.attempts < 1) throw new Error('Invalid review state');
    result[card.character] = {learned: p.learned, stage: p.stage, due: p.due, attempts: p.attempts};
  }
  return result;
}
