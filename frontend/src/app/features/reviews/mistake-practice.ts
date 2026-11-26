import { AnswerResult, checkAnswer } from '../learn/answer-checker';
import { Question, Subject } from '../forge/forge-engine';
import { ReviewBatch } from './review-session';

export interface PracticeResult { index: number; answer: AnswerResult; }
export interface MistakePractice {
  questions: Question[];
  cursor: number;
  results: PracticeResult[];
  closed: boolean;
}
/** Take only actual scored mistakes, preserving distinct meaning/reading questions. */
export function createMistakePractice(outcomes: ReviewBatch['outcomes'], subjects: readonly Subject[]): MistakePractice {
  return createQuestionPractice(outcomes.flatMap(outcome=>
    outcome.kind==='scored'&&!outcome.correct?[outcome.question]:[]),subjects);
}
/** Resolve canonical content and deduplicate skills for non-scheduled recall. */
export function createQuestionPractice(selected: readonly Question[], subjects: readonly Subject[]): MistakePractice {
  const catalog=new Map(subjects.map(s=>[s.id,s])), seen=new Set<string>();
  const questions: Question[]=[];
  for (const {subject:old,skill} of selected) {
    const subject=catalog.get(old.id), key=old.id+':'+skill;
    if (!subject || seen.has(key) || (skill==='reading'&&!subject.readings.length)) continue;
    seen.add(key);questions.push({subject,skill});
  }
  return {questions,cursor:0,results:[],closed:false};
}
export function practiceQuestion(session: MistakePractice): Question | undefined {
  return !session.closed ? session.questions[session.cursor] : undefined;
}
export function submitPractice(session: MistakePractice, answer: string, synonyms: readonly string[] = []) {
  const q = practiceQuestion(session);
  if (!q || session.results.some(r=>r.index===session.cursor)) return {session};
  const feedback = checkAnswer(q.subject,q.skill,answer,synonyms);
  if (feedback.status==='retry') return {session,feedback};
  return {session:{...session,results:[...session.results,{index:session.cursor,answer:feedback}]},feedback};
}
export function nextPractice(session: MistakePractice): MistakePractice {
  if (session.closed || !session.results.some(r=>r.index===session.cursor)) return session;
  const cursor = session.cursor+1;
  return {...session,cursor,closed:cursor>=session.questions.length};
}
export function practiceSummary(session: MistakePractice) {
  return {total:session.questions.length,answered:session.results.length,
    correct:session.results.filter(r=>r.answer.status==='correct').length,
    incorrect:session.results.filter(r=>r.answer.status==='incorrect').length,
    unanswered:session.questions.length-session.results.length};
}
