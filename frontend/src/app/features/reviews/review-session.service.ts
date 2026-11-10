import { Injectable } from '@angular/core';
import { AccountService } from '../account/account.service';
import { StudySyncService } from '../learn/study-sync.service';
import { ReviewBatch, ReviewFeedback, ScoredReview, createReviewBatch, finishReview, nextReview, reviewSummary, submitReview } from './review-session';

/** Session UI stays in this tab; each scored answer uses the existing durable progress/history path. */
@Injectable({providedIn: 'root'})
export class ReviewSessionService {
  batch: ReviewBatch | null = null;
  feedback?: ReviewFeedback;
  draft = '';
  limit = 20;
  private owner: string | null = null;
  constructor(public readonly sync: StudySyncService, private readonly account: AccountService) {}
  get canStart(): boolean { return this.sync.ready && !this.account.changing; }
  get allowed(): boolean { return this.canStart && this.owner === this.account.account.id; }
  get complete(): boolean { return !!this.batch && (this.batch.closed || this.batch.cursor >= this.batch.tickets.length); }
  get question() { return !this.complete ? this.batch?.tickets[this.batch.cursor]?.question : undefined; }
  get summary() { return this.batch ? reviewSummary(this.batch) : null; }
  get scored(): ScoredReview | undefined {
    const outcome = this.batch?.outcomes.find(outcome => outcome.ticketIndex === this.batch!.cursor);
    return outcome?.kind === 'scored' ? outcome : undefined;
  }
  get openSession() {
    return this.allowed && this.batch && !this.complete ? {view: 'typed-review' as const, label: 'typed review',
      remaining: this.batch.tickets.length - this.batch.cursor, review: true} : null;
  }
  begin(limit = this.limit): void {
    if (!this.canStart) return;
    const batch = createReviewBatch(this.sync.forgeSubjects, this.sync.state.value.forge, limit);
    this.owner = this.account.account.id; this.limit = limit; this.batch = batch; this.feedback = undefined; this.draft = '';
  }
  check(dontKnow = false): void {
    if (!this.allowed || !this.batch || (this.feedback && this.feedback.status !== 'retry') || (!dontKnow && !this.draft.trim())) return;
    const result = submitReview(this.batch, this.sync.forgeSubjects, this.sync.state.value.forge, dontKnow ? '' : this.draft);
    if (result.attempt) this.sync.updateForge(result.forge, result.attempt);
    this.batch = result.batch; this.feedback = result.feedback;
  }
  next(): void {
    if (!this.allowed || !this.batch) return;
    const batch = nextReview(this.batch);
    if (batch === this.batch) return;
    this.batch = batch; this.feedback = undefined; this.draft = '';
  }
  finish(): void { if (this.allowed && this.batch) { this.batch = finishReview(this.batch); this.feedback = undefined; this.draft = ''; } }
  clear(): void { this.batch = null; this.feedback = undefined; this.draft = ''; this.owner = null; }
}
