import { KanjiCard } from '../learn/kanji-engine';
import { Word, availableWords, targetedVocabulary } from '../learn/practice-engine';
import { assumedKanji, targetBand } from '../learn/proficiency';
import { Subject, skills } from '../forge/forge-engine';
import { HomeProgress } from './study-home';

export interface ReviewCounts { kanji: number; vocabulary: number; forge: number; }
export interface ForecastBucket { start: number; end: number; counts: ReviewCounts; }
export interface ReviewForecast {
  dueNow: ReviewCounts;
  hours: ForecastBucket[];
  days: ForecastBucket[];
  nextAt?: number;
  scheduled: boolean;
}
const counts = (): ReviewCounts => ({kanji: 0, vocabulary: 0, forge: 0});
const HOUR = 3600000;

/** A snapshot of existing schedules, without predicting answers or introducing new lessons. */
export function reviewForecast(cards: KanjiCard[], words: Word[], subjects: Subject[], state: HomeProgress, now: number): ReviewForecast {
  const hours = Array.from({length: 6}, (_, i) => ({start: now + i * 4 * HOUR, end: now + (i + 1) * 4 * HOUR, counts: counts()}));
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  // Calendar arithmetic keeps local days correct through daylight-saving transitions.
  const dayAt = (offset: number): number => {
    const date = new Date(midnight);
    date.setDate(date.getDate() + offset);
    return date.getTime();
  };
  const days = Array.from({length: 7}, (_, i) => ({start: dayAt(i), end: dayAt(i + 1), counts: counts()}));
  const result: ReviewForecast = {dueNow: counts(), hours, days, scheduled: false};
  const add = (kind: keyof ReviewCounts, due: number | null | undefined): void => {
    if (typeof due !== 'number' || !Number.isFinite(due) || due < 0) return;
    result.scheduled = true;
    if (due <= now) { result.dueNow[kind]++; return; }
    result.nextAt = Math.min(result.nextAt ?? due, due);
    for (const buckets of [hours, days]) {
      const bucket = buckets.find(b => due >= b.start && due < b.end);
      if (bucket) bucket.counts[kind]++;
    }
  };
  for (const card of cards) add('kanji', state.kanji[card.character]?.due);
  const available = availableWords(targetedVocabulary(cards, words, state.vocabulary, targetBand(state.profile)), state.kanji, assumedKanji(cards, state.profile, state.kanji));
  for (const word of available) add('vocabulary', state.vocabulary[word.id]?.due);
  for (const subject of subjects) for (const skill of skills(subject)) {
    const track = state.forge.records[subject.id]?.[skill];
    if (track && track.stage < 9) add('forge', track.due);
  }
  return result;
}
