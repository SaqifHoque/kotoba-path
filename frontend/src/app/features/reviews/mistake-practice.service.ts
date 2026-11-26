import { Injectable } from '@angular/core';
import { AccountService } from '../account/account.service';
import { StudySyncService } from '../learn/study-sync.service';
import { AnswerResult } from '../learn/answer-checker';
import { ReviewBatch } from './review-session';
import { ReviewSessionService } from './review-session.service';
import { MistakePractice, createMistakePractice, createQuestionPractice, nextPractice, practiceQuestion, practiceSummary, submitPractice } from './mistake-practice';
import { TroubleFilters, filterTroubleSpots, troublePracticeQuestions, troubleSpots } from './trouble-spots';

@Injectable({providedIn:'root'})
export class MistakePracticeService {
  session: MistakePractice | null = null;
  draft = '';
  feedback?: AnswerResult;
  notice = '';
  source = '';
  origin: 'batch' | 'trouble-spots' = 'batch';
  private owner?: string;
  private sourceBatch?: ReviewBatch;
  constructor(private readonly sync: StudySyncService, private readonly account: AccountService,
      private readonly reviews: ReviewSessionService) {}
  get ready() { return this.sync.ready && !this.account.changing; }
  get returnView(): 'typed-review' | 'trouble-spots' { return this.origin==='batch'?'typed-review':'trouble-spots'; }
  get returnLabel() { return this.origin==='batch'?'Return to typed reviews':'Return to trouble spots'; }
  get allowed() { return this.ready && this.owner===this.account.account.id; }
  get complete() { return !!this.session && (this.session.closed || this.session.cursor>=this.session.questions.length); }
  get question() { return !this.complete && this.session ? practiceQuestion(this.session) : undefined; }
  get result() { return this.session?.results.find(r=>r.index===this.session!.cursor); }
  get summary() { return this.session ? practiceSummary(this.session) : null; }
  get note() { return this.question ? this.sync.state.value.forge.records[this.question.subject.id]?.note??'' : ''; }
  get openSession() {
    return this.allowed && this.session && !this.complete ? {view:'mistake-practice' as const,label:this.origin==='batch'?'mistake practice':'trouble-spot practice',
      remaining:this.session.questions.length-this.session.cursor,review:true} : null;
  }
  begin(): boolean {
    this.notice = '';
    if (!this.reviews.allowed || !this.reviews.complete || !this.reviews.batch) return false;
    if (this.allowed && this.sourceBatch===this.reviews.batch && !this.complete) return true;
    const session = createMistakePractice(this.reviews.batch.outcomes,this.sync.forgeSubjects);
    if (!session.questions.length) { this.notice = 'No available scored mistakes in this batch.';return false; }
    this.sourceBatch=this.reviews.batch;
    this.origin='batch';
    this.owner = this.account.account.id; this.session = session; this.draft = ''; this.feedback = undefined;
    this.source = this.reviews.scope?.label ?? 'Latest typed review batch';
    return true;
  }
  beginTroubleSpots(filters: TroubleFilters): boolean {
    if (!this.ready) return false;
    const matched=filterTroubleSpots(troubleSpots(this.sync.forgeSubjects,this.sync.state.value.forge,Date.now()),filters);
    const session=createQuestionPractice(troublePracticeQuestions(matched),this.sync.forgeSubjects);
    if (!session.questions.length) return false;
    this.owner=this.account.account.id;this.session=session;this.sourceBatch=undefined;this.origin='trouble-spots';
    this.source='Trouble spots · saved typed-review counters';this.draft='';this.feedback=undefined;this.notice='';
    return true;
  }
  check(reveal = false): void {
    if (!this.allowed || !this.session || this.result || (!reveal&&!this.draft.trim())) return;
    const result = submitPractice(this.session,reveal?'':this.draft,this.question
      ?this.sync.state.value.forge.meaningSynonyms?.[this.question.subject.id]?.values:[]);
    this.session = result.session; this.feedback = result.feedback;
  }
  next(): void {
    if (!this.allowed || !this.session) return;
    const next = nextPractice(this.session);
    if (next!==this.session) { this.session=next;this.draft='';this.feedback=undefined; }
  }
  restart(): void {
    if (!this.allowed || !this.session) return;
    this.session={...this.session,cursor:0,results:[],closed:false};this.draft='';this.feedback=undefined;
  }
  finish(): void { if (this.allowed && this.session) this.session={...this.session,closed:true}; }
  clear(): void { this.sourceBatch=undefined;this.session=null;this.owner=undefined;this.draft='';this.feedback=undefined;this.notice='';this.source='';this.origin='batch'; }
}
