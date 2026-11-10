import { AnswerResult, checkAnswer } from '../learn/answer-checker';
import { ReviewAttempt } from '../learn/review-history';
import { ForgeState, Question, Subject, Track, dueQuestions, review } from '../forge/forge-engine';

export const REVIEW_BATCH_SIZES = [10, 20, 40] as const;
export interface ReviewTicket { question: Question; trackSignature: string; }
interface Outcome { ticketIndex: number; question: Question; }
export interface ScoredReview extends Outcome {
  kind: 'scored'; correct: boolean; beforeStage: number; afterStage: number;
  nextDue: number | null; accepted: string[];
}
export interface SkippedReview extends Outcome { kind: 'skipped'; }
export interface ReviewBatch {
  tickets: ReviewTicket[]; cursor: number; outcomes: (ScoredReview | SkippedReview)[]; closed: boolean;
}
export type ReviewFeedback = AnswerResult | {status: 'skipped'; message: string; accepted: string[]};
export interface ReviewSubmission {
  batch: ReviewBatch; forge: ForgeState; feedback?: ReviewFeedback; attempt?: ReviewAttempt;
}
function signature(track?: Track): string {
  return track ? JSON.stringify([track.stage, track.due, track.reviews, track.correct, track.misses, track.updatedAt]) : '';
}
export function createReviewBatch(subjects: Subject[], forge: ForgeState, limit = 20, now = Date.now()): ReviewBatch {
  if (!(REVIEW_BATCH_SIZES as readonly number[]).includes(limit)) throw new Error('Choose 10, 20 or 40 questions.');
  const tickets = dueQuestions(subjects, forge, now).slice(0, limit).map(question => ({
    question, trackSignature: signature(forge.records[question.subject.id]?.[question.skill])
  }));
  return {tickets, cursor: 0, outcomes: [], closed: false};
}

/** Grade once against the current track. UI feedback and navigation never rescore an answer. */
export function submitReview(batch: ReviewBatch, subjects: Subject[], forge: ForgeState, answer: string, now = Date.now()): ReviewSubmission {
  const ticket = batch.tickets[batch.cursor], unchanged = {batch, forge};
  if (batch.closed || !ticket || batch.outcomes.some(outcome => outcome.ticketIndex === batch.cursor)) return unchanged;
  const question = ticket.question, track = forge.records[question.subject.id]?.[question.skill];
  const subject = subjects.find(subject => subject.id === question.subject.id);
  const skip = (): ReviewSubmission => ({forge,
    batch: {...batch, outcomes: [...batch.outcomes, {kind: 'skipped', ticketIndex: batch.cursor, question}]},
    feedback: {status: 'skipped', message: 'This review changed while the batch was open. It was not scored; continue to the next question.', accepted: []}
  });
  if (!subject || !track || signature(track) !== ticket.trackSignature || track.due === null || track.stage === 9 || track.due > now) return skip();
  const result = checkAnswer(subject, question.skill, answer, forge.meaningSynonyms?.[subject.id]?.values);
  if (result.status === 'retry') return {...unchanged, feedback: result};
  const correct = result.status === 'correct', nextForge = review(subject, question.skill, correct, subjects, forge, now);
  if (nextForge === forge) return skip();
  const nextTrack = nextForge.records[subject.id][question.skill]!;
  const outcome: ScoredReview = {kind: 'scored', ticketIndex: batch.cursor, question, correct,
    beforeStage: track.stage, afterStage: nextTrack.stage, nextDue: nextTrack.due, accepted: [...result.accepted]};
  return {batch: {...batch, outcomes: [...batch.outcomes, outcome]}, forge: nextForge, feedback: result,
    attempt: {mode: 'forge', subject: subject.id, label: subject.text, skill: question.skill, kind: 'scheduled',
      outcome: correct ? 'correct' : 'incorrect', occurredAt: now}};
}
export function nextReview(batch: ReviewBatch): ReviewBatch {
  return batch.closed || !batch.outcomes.some(outcome => outcome.ticketIndex === batch.cursor)
    ? batch : {...batch, cursor: batch.cursor + 1};
}
export function finishReview(batch: ReviewBatch): ReviewBatch { return batch.closed ? batch : {...batch, closed: true}; }
export function reviewSummary(batch: ReviewBatch) {
  const scored = batch.outcomes.filter((outcome): outcome is ScoredReview => outcome.kind === 'scored');
  const correct = scored.filter(outcome => outcome.correct).length;
  return {total: batch.tickets.length, answered: scored.length, correct, incorrect: scored.length - correct,
    skipped: batch.outcomes.length - scored.length, remaining: batch.tickets.length - batch.outcomes.length,
    subjects: new Set(scored.map(outcome => outcome.question.subject.id)).size,
    totalSubjects: new Set(batch.tickets.map(ticket => ticket.question.subject.id)).size,
    accuracy: scored.length ? Math.round(100 * correct / scored.length) : null,
    mistakes: scored.filter(outcome => !outcome.correct)};
}
