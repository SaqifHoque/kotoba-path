import { ForgeState, Skill, STAGES } from '../forge/forge-engine';
import { StudyChapter } from './chapter';

export interface ChapterItemProgress {
  id: string;
  text: string;
  kind: 'kanji' | 'word';
  introduced: boolean;
  retained: boolean;
  meaning: string;
  reading: string;
}
export interface ChapterProgress {
  items: ChapterItemProgress[];
  subjectIds: string[];
  introducedKanji: number;
  introducedWords: number;
  retainedKanji: number;
  retainedWords: number;
  kanjiTotal: number;
  wordTotal: number;
  introductionsComplete: boolean;
  retentionReached: boolean;
  dueQuestions: number;
  dueSubjects: number;
  nextReviewAt?: number;
  next: 'lessons' | 'reviews' | 'wait' | 'reading';
}

/** Retention means both existing meaning and reading tracks are at Guru I or above. */
export function chapterProgress(chapter: StudyChapter, forge: ForgeState, now: number): ChapterProgress {
  const definitions = [
    ...chapter.kanji.map(k => ({id:k.subjectId, text:k.subjectId.slice(2), kind:'kanji' as const})),
    ...chapter.words.map(w => ({id:w.id, text:w.text, kind:'word' as const}))
  ];
  const ids = definitions.map(d => d.id);
  if (!ids.length || new Set(ids).size !== ids.length) throw new Error('Chapter progress requires unique subjects');
  let dueQuestions = 0;
  let dueSubjects = 0;
  let nextReviewAt: number | undefined;
  const items = definitions.map(item => {
    const record = forge.records[item.id];
    const tracks = [record?.meaning, record?.reading];
    const introduced = tracks.every(t => !!t && t.stage >= 1 && t.stage <= 9);
    const retained = introduced && tracks.every(t => t!.stage >= 5);
    let due = false;
    for (const track of tracks) {
      if (!track || track.stage < 1 || track.stage >= 9 || track.due === null) continue;
      if (track.due <= now) { dueQuestions++; due = true; }
      else if (nextReviewAt === undefined || track.due < nextReviewAt) nextReviewAt = track.due;
    }
    if (due) dueSubjects++;
    const label = (skill: Skill) => {
      const track = record?.[skill];
      return track && track.stage >= 1 && track.stage <= 9 ? STAGES[track.stage] : 'Not introduced';
    };
    return {...item, introduced, retained, meaning:label('meaning'), reading:label('reading')};
  });
  const count = (kind: ChapterItemProgress['kind'], key: 'introduced'|'retained') => items.filter(i=>i.kind===kind&&i[key]).length;
  const introductionsComplete = items.every(i => i.introduced);
  const retentionReached = items.every(i => i.retained);
  return {
    items, subjectIds:ids,
    introducedKanji:count('kanji','introduced'), introducedWords:count('word','introduced'),
    retainedKanji:count('kanji','retained'), retainedWords:count('word','retained'),
    kanjiTotal:chapter.kanji.length, wordTotal:chapter.words.length,
    introductionsComplete, retentionReached, dueQuestions, dueSubjects, nextReviewAt,
    next:dueQuestions ? 'reviews' : !introductionsComplete ? 'lessons' : retentionReached ? 'reading' : 'wait'
  };
}
