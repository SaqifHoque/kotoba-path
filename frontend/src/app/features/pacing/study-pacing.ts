import { ForgeState, Subject, dueQuestions, lessonAllowance, mastery } from '../forge/forge-engine';

export const COMEBACK_AGE = 7 * 86400000;
export interface StudyPacing {
  dueQuestions: number;
  dueSubjects: number;
  olderQuestions: number;
  oldestDue?: number;
  nextReviewAt?: number;
  apprentice: number;
  introducedToday: number;
  allowance: number;
  limit: number;
  reason: 'backlog' | 'apprentice' | 'daily-limit' | 'available';
  heading: string;
}
/** Describe existing workload guards. An old due date is evidence of overdue work, not absence. */
export function studyPacing(subjects: Subject[], state: ForgeState, now: number): StudyPacing {
  const due = dueQuestions(subjects,state,now);
  const dates = due.map(q=>state.records[q.subject.id][q.skill]!.due!);
  const olderQuestions = dates.filter(at=>now-at>=COMEBACK_AGE).length;
  const apprentice = Object.values(state.records).filter(r=>mastery(r)<5).length;
  const introducedToday = Object.values(state.records).filter(r=>new Date(r.lessonAt).toDateString()===new Date(now).toDateString()).length;
  const future = subjects.flatMap(s=>[state.records[s.id]?.meaning,state.records[s.id]?.reading])
    .filter(t=>t&&t.stage<9&&t.due!==null&&t.due>now).map(t=>t!.due!);
  return {
    dueQuestions:due.length,dueSubjects:new Set(due.map(q=>q.subject.id)).size,olderQuestions,
    oldestDue:dates.length?Math.min(...dates):undefined,
    nextReviewAt:future.length?Math.min(...future):undefined,
    apprentice,introducedToday,allowance:lessonAllowance(subjects,state,now),limit:state.dailyLimit,
    reason:due.length>=20?'backlog':apprentice>=50?'apprentice':introducedToday>=state.dailyLimit?'daily-limit':'available',
    heading:olderQuestions?'Pick up gently':due.length?'One small review session':'Make room for tomorrow'
  };
}

export function withDailyLimit(state: ForgeState, limit: number, now: number): ForgeState {
  if (![5,10,20].includes(limit)) throw new Error('Choose 5, 10 or 20 typed subjects.');
  return state.dailyLimit === limit ? state : {...state,dailyLimit:limit,settingsAt:now};
}
