import type { Subject } from '../forge/forge-engine';
import { STARTER_CHAPTER } from './starter-chapter';

/** Add authored words to the shared typed-review catalog, reusing published IDs. */
export function withChapterWords(subjects: Subject[]): Subject[] {
  const known = new Map(subjects.map(subject => [subject.id, subject]));
  const additions: Subject[] = [];
  for (const word of STARTER_CHAPTER.words) {
    if (known.has(word.id)) continue;
    if (word.kanjiIds.some(id => !known.has(id))) throw new Error('Missing chapter kanji');
    additions.push({id: word.id, kind: 'vocabulary', text: word.text, meaning: word.meaning,
      readings: [word.reading], prerequisites: [...word.kanjiIds],
      level: Math.max(...word.kanjiIds.map(id => known.get(id)!.level)),
      hint: `${word.sentence.text} — ${word.sentence.meaning}`});
  }
  return [...subjects, ...additions];
}
