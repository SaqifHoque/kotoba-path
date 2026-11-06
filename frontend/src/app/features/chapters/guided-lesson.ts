import { AnswerResult } from '../learn/answer-checker';
import { ForgeState, Subject, lessonAllowance, newForgeRecord } from '../forge/forge-engine';
import { StudyChapter } from './chapter';

export type LessonStep = {kind: 'shape'; shapeId: string} | {kind: 'study'; subjectId: string} |
  {kind: 'check'; subjectId: string; skill: 'meaning' | 'reading'};
export interface LessonSession { version: 1; chapterId: string; chapterVersion: string; cursor: number; }
export interface LessonFeedback { cursor: number; result: AnswerResult; }
export interface LessonTransition { session: LessonSession; forge: ForgeState; blocked: boolean; }

export function lessonSteps(chapter: StudyChapter): LessonStep[] {
  return [
    ...chapter.shapes.map(shape => ({kind: 'shape' as const, shapeId: shape.id})),
    ...[...chapter.kanji.map(item => item.subjectId), ...chapter.words.map(word => word.id)].flatMap(subjectId => [
      {kind: 'study' as const, subjectId},
      {kind: 'check' as const, subjectId, skill: 'meaning' as const},
      {kind: 'check' as const, subjectId, skill: 'reading' as const}
    ])
  ];
}
export function beginLesson(chapter: StudyChapter): LessonSession {
  return {version: 1, chapterId: chapter.id, chapterVersion: chapter.version, cursor: 0};
}
export function parseLesson(value: unknown, chapter: StudyChapter): LessonSession {
  const session = value as LessonSession;
  if (!session || session.version !== 1 || session.chapterId !== chapter.id || session.chapterVersion !== chapter.version ||
      !Number.isInteger(session.cursor) || session.cursor < 0 || session.cursor > lessonSteps(chapter).length) {
    throw new Error('This saved lesson does not match the current chapter.');
  }
  return {version: 1, chapterId: session.chapterId, chapterVersion: session.chapterVersion, cursor: session.cursor};
}

/** Only a completed meaning+reading introduction creates a record. Scheduled mastery never changes here. */
export function advanceLesson(session: LessonSession, chapter: StudyChapter, subjects: Subject[], forge: ForgeState,
    feedback?: LessonFeedback, now = Date.now()): LessonTransition {
  parseLesson(session, chapter);
  const step = lessonSteps(chapter)[session.cursor];
  const unchanged = {session, forge, blocked: false};
  if (!step) return unchanged;
  if (step.kind === 'check' && (feedback?.cursor !== session.cursor || feedback.result.status !== 'correct')) return unchanged;
  let nextForge = forge;
  if (step.kind !== 'shape') {
    const subject = subjects.find(subject => subject.id === step.subjectId);
    if (!subject || !subject.readings.length) throw new Error('Missing lesson subject or review reading.');
    if (!forge.records[subject.id]) {
      if (!lessonAllowance(subjects, forge, now)) return {...unchanged, blocked: true};
      if (step.kind === 'check' && step.skill === 'reading') {
        nextForge = {...forge, records: {...forge.records, [subject.id]: newForgeRecord(subject, now)}};
      }
    }
  }
  return {session: {...session, cursor: session.cursor + 1}, forge: nextForge, blocked: false};
}

/** A cursor must never skip an introduction whose progress failed to survive a reload. */
export function reconcileLesson(session: LessonSession, chapter: StudyChapter, forge: ForgeState): LessonSession {
  parseLesson(session, chapter);
  const steps = lessonSteps(chapter);
  for (let index = 0; index < session.cursor; index++) {
    const step = steps[index];
    if (step.kind === 'check' && step.skill === 'reading' && !forge.records[step.subjectId]) {
      return {...session, cursor: index - 2};
    }
  }
  return session;
}
