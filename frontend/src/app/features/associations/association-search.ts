import { acceptedMeanings, normalizeReading } from '../learn/answer-checker';
import { Subject } from '../forge/forge-engine';
import { STARTER_CHAPTER } from '../chapters/starter-chapter';

export interface AssociationMatches { items: Subject[]; total: number; }
export type AssociationSearch = (query: string) => AssociationMatches;
const normalize = (value: string): string => normalizeReading(value.trim()).toLowerCase();

/** Precompute terms once; each keystroke searches only the current study catalog. */
export function associationSearch(subjects: Subject[], limit = 24): AssociationSearch {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new Error('Invalid association result limit');
  const byId = new Map(subjects.map(subject => [subject.id, subject]));
  const starters = [...STARTER_CHAPTER.kanji.map(item => item.subjectId), ...STARTER_CHAPTER.words.map(word => word.id)]
    .map(id => byId.get(id)).filter((subject): subject is Subject => !!subject);
  const terms = subjects.map((subject, order) => ({subject, order, text: normalize(subject.text),
    readings: [...subject.readings, ...(subject.otherReadings ?? [])].map(normalize),
    meanings: acceptedMeanings(subject).map(normalize)}));
  const kindOrder = {kanji: 0, vocabulary: 1, radical: 2};
  return query => {
    const input = normalize(query);
    if (!input) return {items: starters.slice(0, limit), total: starters.length};
    const matches = terms.map(item => {
      const score = item.text === input ? 100 : item.readings.includes(input) ? 90 :
        item.text.startsWith(input) ? 80 : item.text.includes(input) ? 70 :
        item.readings.some(reading => reading.startsWith(input)) ? 60 : item.readings.some(reading => reading.includes(input)) ? 55 :
        item.meanings.includes(input) ? 50 : item.meanings.some(meaning => meaning.startsWith(input)) ? 40 :
        item.meanings.some(meaning => meaning.includes(input)) ? 30 : 0;
      return {...item, score};
    }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || kindOrder[a.subject.kind] - kindOrder[b.subject.kind] || a.order - b.order);
    return {items: matches.slice(0, limit).map(item => item.subject), total: matches.length};
  };
}
