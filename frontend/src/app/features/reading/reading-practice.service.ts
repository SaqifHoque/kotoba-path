import { Injectable } from '@angular/core';
import { AccountService } from '../account/account.service';
import { StudySyncService } from '../learn/study-sync.service';
import { AnswerResult } from '../learn/answer-checker';
import { STARTER_READING } from './starter-reading';
import { ReadingSession, advanceReading, beginReading, chooseReading, currentAttempt, currentCard, readingSummary, submitReading, supportReading } from './reading-session';

/** Practice is deliberately transient: never writes progress, review history or storage. */
@Injectable({providedIn:'root'})
export class ReadingPracticeService {
  session: ReadingSession | null = null;
  draft = '';
  feedback?: AnswerResult;
  private owner: string | null = null;
  constructor(private readonly sync: StudySyncService, private readonly account: AccountService) {}
  get canStart() { return this.sync.ready && !this.account.changing; }
  get allowed() { return this.canStart && this.owner === this.account.account.id; }
  get card() { return this.session ? currentCard(this.session) : undefined; }
  get attempt() { return this.session ? currentAttempt(this.session) : undefined; }
  get question() { return this.card?.questions[this.session?.question ?? 0]; }
  get result() { return this.attempt?.answers[this.session?.question ?? 0]; }
  get summary() { return this.session ? readingSummary(this.session) : null; }
  get openSession() {
    return this.allowed && this.session && !this.session.closed ? {view:'reading-practice' as const,
      label:'reading practice', remaining:this.session.cards.length-this.session.cursor,review:false} : null;
  }
  begin(wordId?: string): void {
    if (!this.canStart) return;
    const session = beginReading(STARTER_READING, wordId);
    this.session = session; this.owner = this.account.account.id; this.draft = ''; this.feedback = undefined;
  }
  help(kind:'kana'|'meaning'|'lookup'|'grammar'): void {
    if (this.allowed && this.session) this.session = supportReading(this.session,kind);
  }
  check(reveal = false): void {
    if (!this.allowed || !this.session || (!reveal && !this.draft.trim())) return;
    const result = submitReading(this.session,reveal ? '' : this.draft);
    this.session = result.session; this.feedback = result.feedback;
  }
  choose(choice: number): void { if (this.allowed && this.session) this.session = chooseReading(this.session,choice); }
  next(): void {
    if (!this.allowed || !this.session) return;
    const next = advanceReading(this.session);
    if (next !== this.session) { this.session = next; this.draft = ''; this.feedback = undefined; }
  }
  finish(): void { if (this.allowed && this.session) this.session = {...this.session,closed:true}; }
  clear(): void { this.session = null; this.owner = null; this.draft = ''; this.feedback = undefined; }
}
