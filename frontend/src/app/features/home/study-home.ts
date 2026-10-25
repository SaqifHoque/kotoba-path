import { KanjiCard, ReviewProgress, dueCards } from '../learn/kanji-engine';
import { Proficiency, assumedKanji, recommendedCards, targetBand } from '../learn/proficiency';
import { Word, availableWords, targetedVocabulary } from '../learn/practice-engine';
import { ForgeState, Subject, canLearn, dueQuestions, lessonAllowance, mastery } from '../forge/forge-engine';

export type StudyMode = 'path' | 'forge';
export type StudyView = 'home' | 'learn' | 'forge' | 'history' | 'catalog' | 'settings';
export type StudyAction = 'kanji-lessons' | 'kanji-reviews' | 'vocabulary' | 'forge-lessons' | 'forge-reviews';
export interface StudyLaunch { id: number; action: StudyAction; }
export interface HomePreference { version: 1; mode: StudyMode; }
export interface HomeProgress { profile: Proficiency | null; kanji: ReviewProgress; vocabulary: ReviewProgress; forge: ForgeState; }
export interface DailyPlan {
  kanjiDue: number; wordsDue: number; forgeQuestions: number; forgeSubjects: number;
  newKanji: number; newWords: number; forgeLessons: number; forgePause: string;
  nextReviewAt?: number;
  next: {action: StudyAction; label: string; detail: string} | null;
}

export function parseHomePreference(raw: string | null): HomePreference | null {
  if (!raw) return null;
  const value = JSON.parse(raw) as HomePreference;
  if (value?.version !== 1 || !['path', 'forge'].includes(value.mode)) throw new Error('Invalid study preference');
  return {version: 1, mode: value.mode};
}
export function hasStudyProgress(state: HomeProgress): boolean {
  return !!state.profile || !!(Object.keys(state.kanji).length + Object.keys(state.vocabulary).length + Object.keys(state.forge.records).length);
}
export function preferredMode(state: HomeProgress, preference: HomePreference | null): StudyMode {
  return preference?.mode ?? (Object.keys(state.forge.records).length && !Object.keys(state.kanji).length && !Object.keys(state.vocabulary).length ? 'forge' : 'path');
}
export function actionView(action: StudyAction): 'learn' | 'forge' { return action.startsWith('forge-') ? 'forge' : 'learn'; }

/** Derive counts from the same eligibility and limit rules used by the study screens. */
export function dailyPlan(cards: KanjiCard[], words: Word[], subjects: Subject[], state: HomeProgress, mode: StudyMode, now: number): DailyPlan {
  const kanji = dueCards(cards, state.kanji, now);
  const available = availableWords(targetedVocabulary(cards, words, state.vocabulary, targetBand(state.profile)), state.kanji, assumedKanji(cards, state.profile, state.kanji));
  const vocabulary = available.filter(w => state.vocabulary[w.id]?.due <= now).sort((a, b) => state.vocabulary[a.id].due - state.vocabulary[b.id].due);
  const forge = dueQuestions(subjects, state.forge, now);
  const newKanji = recommendedCards(cards, state.profile, state.kanji).length;
  const newWords = available.filter(w => !state.vocabulary[w.id]).length;
  const allowance = lessonAllowance(subjects, state.forge, now);
  const forgeLessons = Math.min(allowance, subjects.filter(s => canLearn(s, state.forge)).length);
  const apprentice = Object.values(state.forge.records).filter(r => mastery(r) < 5).length;
  const forgePause = forgeLessons ? '' : forge.length >= 20 ? 'Finish due reviews before new Forge lessons.'
    : apprentice >= 50 ? 'Let Apprentice items reach Guru before adding more lessons.'
    : !allowance ? 'Your Forge lesson limit is reached for today.' : 'New Forge lessons unlock as prerequisites reach Guru.';
  const choices: {action: StudyAction; label: string; detail: string; due: number}[] = [];
  if (kanji.length) choices.push({action: 'kanji-reviews', label: `Review kanji · ${kanji.length} due`, detail: 'Recall meaning and reading in a batch of up to 20 kanji.', due: state.kanji[kanji[0].character].due});
  if (vocabulary.length) choices.push({action: 'vocabulary', label: `Review vocabulary · ${vocabulary.length} due`, detail: 'Review whole-word readings in a batch of up to 10 words.', due: state.vocabulary[vocabulary[0].id].due});
  if (forge.length) choices.push({action: 'forge-reviews', label: `Review Forge · ${forge.length} questions`, detail: 'Review meaning and reading tracks in a batch of up to 40 questions.', due: state.forge.records[forge[0].subject.id][forge[0].skill]!.due!});
  choices.sort((a, b) => a.due - b.due || Number(actionView(a.action) !== (mode === 'forge' ? 'forge' : 'learn')) - Number(actionView(b.action) !== (mode === 'forge' ? 'forge' : 'learn')));
  let next: DailyPlan['next'] = choices[0] ?? null;
  if (!next && mode === 'forge' && forgeLessons) next = {action: 'forge-lessons', label: 'Start Forge lessons', detail: 'Introduce up to five eligible items within your daily limit.'};
  if (!next && mode === 'path' && newWords) next = {action: 'vocabulary', label: 'Learn unlocked vocabulary', detail: 'Put familiar kanji to work through whole-word reading.'};
  if (!next && mode === 'path' && newKanji) next = {action: 'kanji-lessons', label: 'Learn your next kanji', detail: `Start up to ten recommended kanji near ${targetBand(state.profile)}.`};
  const dates = [...cards.map(c => state.kanji[c.character]?.due), ...available.map(w => state.vocabulary[w.id]?.due),
    ...subjects.flatMap(s => [state.forge.records[s.id]?.meaning, state.forge.records[s.id]?.reading].filter(t => t && t.stage < 9).map(t => t!.due))]
    .filter((date): date is number => typeof date === 'number' && date > now);
  return {kanjiDue: kanji.length, wordsDue: vocabulary.length, forgeQuestions: forge.length,
    forgeSubjects: new Set(forge.map(q => q.subject.id)).size, newKanji, newWords, forgeLessons, forgePause,
    nextReviewAt: dates.length ? Math.min(...dates) : undefined, next};
}
