import { Injectable } from '@angular/core';
import { AccountService } from '../account/account.service';
import { StudySyncService } from '../learn/study-sync.service';
import { checkAnswer } from '../learn/answer-checker';
import { OpenSession } from '../study/study-overview';
import { STARTER_CHAPTER } from './starter-chapter';
import { LessonFeedback, LessonSession, advanceLesson, beginLesson, lessonSteps, parseLesson, reconcileLesson } from './guided-lesson';

@Injectable({providedIn: 'root'})
export class GuidedLessonService {
  readonly chapter = STARTER_CHAPTER;
  readonly steps = lessonSteps(this.chapter);
  session: LessonSession | null = null;
  feedback?: LessonFeedback;
  draft = '';
  warning = '';
  paused = false;
  private owner: string | null = null;
  private readonly key = 'kotoba-guided-lesson-v1';
  constructor(public readonly sync: StudySyncService, private readonly account: AccountService) {}
  get allowed(): boolean { return this.sync.ready && !this.account.changing && this.owner === this.account.account.id; }
  get step() { return this.session ? this.steps[this.session.cursor] : undefined; }
  get subject() { const step = this.step; return step && step.kind !== 'shape' ? this.sync.forgeSubjects.find(subject => subject.id === step.subjectId) : undefined; }
  get completed(): boolean { return !!this.session && this.session.cursor === this.steps.length; }
  get openSession(): OpenSession | null {
    return this.allowed && this.session && !this.completed ? {view: 'guided', label: 'starter chapter', remaining: this.steps.length - this.session.cursor, review: false} : null;
  }
  restore(): void {
    if (!this.sync.ready || this.account.changing || this.owner === this.account.account.id) return;
    this.owner = this.account.account.id;
    this.session = null; this.feedback = undefined; this.draft = ''; this.warning = ''; this.paused = false;
    try {
      const raw = localStorage.getItem(this.account.cacheKey(this.key));
      if (raw) this.session = reconcileLesson(parseLesson(JSON.parse(raw), this.chapter), this.chapter, this.sync.state.value.forge);
    } catch { this.warning = 'The saved lesson could not be resumed. You can start this chapter again; your learned subjects are kept.'; }
  }
  begin(): void {
    this.restore();
    if (!this.allowed) return;
    this.session = beginLesson(this.chapter); this.feedback = undefined; this.draft = ''; this.paused = false;
    this.save();
  }
  check(): void {
    const step = this.step, subject = this.subject;
    if (!this.allowed || !this.session || step?.kind !== 'check' || !subject || this.feedback) return;
    const result = checkAnswer(subject, step.skill, this.draft, this.sync.state.value.forge.meaningSynonyms?.[subject.id]?.values);
    this.feedback = {cursor: this.session.cursor, result};
    if (result.status !== 'retry') this.sync.updateForge(this.sync.state.value.forge, {
      mode: 'forge', subject: subject.id, label: subject.text, skill: step.skill, kind: 'learning',
      outcome: result.status, occurredAt: Date.now()
    });
  }
  retryAnswer(): void { if (this.allowed && this.feedback?.result.status !== 'correct') { this.feedback = undefined; this.draft = ''; } }
  next(): boolean {
    if (!this.allowed || !this.session) return false;
    const current = this.sync.state.value.forge;
    const transition = advanceLesson(this.session, this.chapter, this.sync.forgeSubjects, current, this.feedback);
    this.paused = transition.blocked;
    if (transition.session === this.session) return false;
    if (transition.forge !== current) this.sync.updateForge(transition.forge);
    this.session = transition.session; this.feedback = undefined; this.draft = '';
    this.save();
    return true;
  }
  clear(): void {
    this.session = null; this.feedback = undefined; this.draft = ''; this.paused = false;
    try { localStorage.removeItem(this.account.cacheKey(this.key)); }
    catch { this.warning = 'The old lesson position could not be removed from this device.'; }
  }
  private save(): void {
    try {
      localStorage.setItem(this.account.cacheKey(this.key), JSON.stringify(this.session));
      this.warning = '';
    } catch { this.warning = 'Your lesson position is kept in this tab. Keep it open to continue; this device could not save the resume position.'; }
  }
}
