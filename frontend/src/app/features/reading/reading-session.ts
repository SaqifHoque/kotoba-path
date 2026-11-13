import { checkReading } from '../learn/answer-checker';
import { ReadingCard, validateReading } from './reading-content';
export interface ReadingResult { correct: boolean; supported: boolean; choice?: number; }
export interface CardAttempt {
  support: ('kana'|'meaning'|'lookup')[];
  reading?: ReadingResult;
  answers: ReadingResult[];
}
export interface ReadingSession {
  cards: readonly ReadingCard[];
  cursor: number;
  question: number;
  attempts: CardAttempt[];
  closed: boolean;
}
export function beginReading(cards: readonly ReadingCard[], wordId?: string): ReadingSession {
  validateReading(cards);
  const selected = wordId ? cards.filter(c => c.wordId === wordId) : [...cards];
  if (!selected.length) throw new Error('Unknown reading word');
  return {cards:selected, cursor:0, question:0, attempts:selected.map(() => ({support:[],answers:[]})), closed:false};
}
export function currentCard(s: ReadingSession) { return !s.closed ? s.cards[s.cursor] : undefined; }
export function currentAttempt(s: ReadingSession) { return !s.closed ? s.attempts[s.cursor] : undefined; }
function updateAttempt(s: ReadingSession, attempt: CardAttempt): ReadingSession {
  return {...s, attempts:s.attempts.map((a,i) => i === s.cursor ? attempt : a)};
}
export function supportReading(s: ReadingSession, support: CardAttempt['support'][number]): ReadingSession {
  const a = currentAttempt(s);
  return !a || a.support.includes(support) ? s : updateAttempt(s, {...a,support:[...a.support,support]});
}
export function submitReading(s: ReadingSession, answer: string) {
  const card = currentCard(s), attempt = currentAttempt(s);
  if (!card?.target || !attempt || attempt.reading) return {session:s};
  const feedback = checkReading(answer, [card.target.reading]);
  if (feedback.status === 'retry') return {session:s, feedback};
  return {session:updateAttempt(s,{...attempt,reading:{correct:feedback.status === 'correct',supported:!!attempt.support.length}}),feedback};
}
export function chooseReading(s: ReadingSession, choice: number): ReadingSession {
  const card = currentCard(s), attempt = currentAttempt(s), question = card?.questions[s.question];
  if (!card || !attempt || (card.target && !attempt.reading) || attempt.answers[s.question] ||
      !question || !Number.isInteger(choice) || choice < 0 || choice >= question.choices.length) return s;
  return updateAttempt(s,{...attempt,answers:[...attempt.answers,{choice,correct:choice === question.correct,supported:!!attempt.support.length}]});
}
export function advanceReading(s: ReadingSession): ReadingSession {
  const card = currentCard(s), a = currentAttempt(s);
  if (!card || !a?.answers[s.question]) return s;
  if (s.question + 1 < card.questions.length) return {...s,question:s.question+1};
  return {...s,cursor:s.cursor+1,question:0,closed:s.cursor+1 >= s.cards.length};
}
export function readingSummary(s: ReadingSession) {
  const readings = s.attempts.flatMap(a => a.reading ? [a.reading] : []);
  const answers = s.attempts.flatMap(a => a.answers);
  return {
    completed:s.attempts.filter((a,i) => a.answers.length === s.cards[i].questions.length).length,
    total:s.cards.length, readings:readings.length, readingCorrect:readings.filter(a=>a.correct).length,
    readingIndependent:readings.filter(a=>a.correct&&!a.supported).length,
    answered:answers.length, correct:answers.filter(a=>a.correct).length,
    supported:answers.filter(a=>a.supported).length,
    questionTotal:s.cards.reduce((n,c)=>n+c.questions.length,0)
  };
}
