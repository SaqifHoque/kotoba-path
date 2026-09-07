import { KanjiCard, ReviewProgress } from './kanji-engine';

export type Band = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export interface Proficiency {
  level: Band | 'unsure';
  familiarity: 'studying' | 'comfortable';
  updatedAt: number;
  placement?: {correct: number; total: number; suggested: Band};
}

export const BANDS: Band[] = ['N5', 'N4', 'N3', 'N2', 'N1'];

// This is an intentionally labelled school-grade heuristic, not an official JLPT mapping.
export function estimatedBand(card: KanjiCard): Band {
  return card.grade <= 1 ? 'N5' : card.grade === 2 ? 'N4' : card.grade <= 4 ? 'N3' : card.grade <= 6 ? 'N2' : 'N1';
}

export function targetBand(profile: Proficiency | null): Band {
  if (!profile || profile.level === 'unsure') return 'N5';
  const step = profile.familiarity === 'comfortable' ? 1 : 0;
  return BANDS[Math.min(BANDS.length - 1, BANDS.indexOf(profile.level) + step)];
}

export function assumedKanji(cards: KanjiCard[], profile: Proficiency | null, progress: ReviewProgress): string[] {
  if (!profile || profile.level === 'unsure') return [];
  const target = BANDS.indexOf(targetBand(profile));
  return cards.filter(card => BANDS.indexOf(estimatedBand(card)) < target && !progress[card.character])
    .map(card => card.character);
}

export function recommendedCards(cards: KanjiCard[], profile: Proficiency | null, progress: ReviewProgress): KanjiCard[] {
  const target = BANDS.indexOf(targetBand(profile));
  return cards.filter(card => BANDS.indexOf(estimatedBand(card)) >= target && !progress[card.character]?.learned)
    .sort((a, b) => BANDS.indexOf(estimatedBand(a)) - BANDS.indexOf(estimatedBand(b)));
}

export function placementSuggestion(band: Band, correct: number): Band {
  const adjustment = correct >= 4 ? 1 : correct <= 1 ? -1 : 0;
  return BANDS[Math.max(0, Math.min(BANDS.length - 1, BANDS.indexOf(band) + adjustment))];
}
