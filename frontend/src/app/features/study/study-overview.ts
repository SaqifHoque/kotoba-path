import { KanjiCard, buildLevels } from '../learn/kanji-engine';
import { Subject, mastery } from '../forge/forge-engine';
import { DailyPlan, HomePreference, HomeProgress, StudyAction, StudyMode, StudyView, hasStudyProgress, preferredMode } from '../home/study-home';

export type StudySection = 'home' | 'learning' | 'reviews' | 'library' | 'settings';
export interface OpenSession { view: 'learn' | 'forge'; label: string; remaining: number; review: boolean; }
export interface LearningMilestone { title: string; completed: number; total: number; detail: string; }
export function sectionFor(view: StudyView): StudySection {
  if (view === 'learn' || view === 'forge') return 'learning';
  if (view === 'history') return 'reviews';
  if (view === 'catalog') return 'library';
  return view;
}
export function isReviewAction(action: StudyAction): boolean { return action === 'kanji-reviews' || action === 'vocabulary-reviews' || action === 'forge-reviews'; }
export function studyRoutine(state: HomeProgress, preference: HomePreference | null): StudyMode {
  return !preference && !hasStudyProgress(state) ? 'forge' : preferredMode(state,preference);
}
export function nextLesson(plan: DailyPlan, mode: StudyMode): DailyPlan['next'] {
  if (mode === 'forge') return plan.forgeLessons ? {action:'forge-lessons',label:'Learn new items',detail:'Study a small set of components, kanji, or words with typed recall.'} : null;
  if (plan.newWords) return {action:'vocabulary',label:'Learn unlocked words',detail:'Connect familiar kanji to whole-word readings.'};
  return plan.newKanji ? {action:'kanji-lessons',label:'Learn your next kanji',detail:'Continue the reading path near your selected starting point.'} : null;
}
export function learningMilestones(cards: KanjiCard[], subjects: Subject[], state: HomeProgress): LearningMilestone[] {
  const levels=buildLevels(cards);
  const level=levels.find(l=>!l.cards.every(c=>state.kanji[c.character]?.learned)) ?? levels[levels.length-1];
  const finalLevel=state.forge.unlockedLevel>=Math.max(0,...subjects.map(s=>s.level));
  const kanji=subjects.filter(s=>s.kind==='kanji'&&s.level===state.forge.unlockedLevel);
  const goal=finalLevel?kanji.length:Math.ceil(kanji.length*.9);
  return [
    {title:`Typed recall · level ${state.forge.unlockedLevel}`,completed:Math.min(goal,kanji.filter(s=>mastery(state.forge.records[s.id])>=5).length),total:goal,detail:finalLevel?'Kanji with both meaning and reading at Guru in the final catalog level.':'Kanji with both meaning and reading at Guru toward the next level.'},
    {title:level?`Reading path · level ${level.number}`:'Reading path',completed:level?.cards.filter(c=>state.kanji[c.character]?.learned).length ?? 0,total:level?.cards.length ?? 0,detail:'Introduced kanji in this level. Assumed foundations do not count as completed work.'}
  ];
}
