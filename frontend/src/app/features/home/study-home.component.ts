import { StudyRoutineService } from '../study/study-routine.service';
import { isReviewAction } from '../study/study-overview';
import { ReviewForecast, reviewForecast } from './review-forecast';
import { ReviewForecastComponent } from './review-forecast.component';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AccountService } from '../account/account.service';
import { KanjiCard } from '../learn/kanji-engine';
import { Band, BANDS, targetBand } from '../learn/proficiency';
import { Word, buildVocabulary } from '../learn/practice-engine';
import { StudySyncService } from '../learn/study-sync.service';
import { DailyPlan, StudyAction, StudyMode, StudyView, dailyPlan, hasStudyProgress } from './study-home';

@Component({selector: 'app-study-home', standalone: true, imports: [CommonModule, FormsModule, ReviewForecastComponent],
  templateUrl: './study-home.component.html', styleUrls: ['./study-home.component.scss']})
export class StudyHomeComponent implements OnInit, OnChanges, OnDestroy {
  @Input() cards: KanjiCard[] = [];
  @Output() start = new EventEmitter<StudyAction>();
  @Output() open = new EventEmitter<StudyView>();
  now = Date.now(); plan?: DailyPlan; forecast: ReviewForecast | null = null; bands = BANDS;
  editing = false; draftMode: StudyMode = 'forge'; draftLevel: Band | 'unsure' = 'unsure';
  familiarity: 'studying' | 'comfortable' = 'studying'; settingsNote = '';
  private words: Word[] = [];
  private subscription?: Subscription; private timer?: ReturnType<typeof setInterval>;
  constructor(public readonly sync: StudySyncService, public readonly account: AccountService, public readonly routine: StudyRoutineService) {}
  ngOnInit(): void {
    this.settingsNote=this.routine.notice;
    this.subscription = this.sync.state.subscribe(() => this.refresh());
    this.timer = setInterval(() => { this.now = Date.now(); this.refresh(); }, 10000);
  }
  ngOnChanges(changes: SimpleChanges): void { if(changes['cards']){this.words=buildVocabulary(this.cards);this.refresh();} }
  get mode(): StudyMode { return this.routine.mode(this.sync.state.value); }
  get target(): Band { return targetBand(this.sync.state.value.profile); }
  get setupVisible(): boolean { return this.editing; }
  get firstVisit(): boolean { return !hasStudyProgress(this.sync.state.value); }
  isReview = isReviewAction;
  private refresh(): void {
    if (this.cards.length) {
      this.plan = dailyPlan(this.cards, this.words, this.sync.forgeSubjects, this.sync.state.value, this.mode, this.now);
      this.forecast = reviewForecast(this.cards, this.words, this.sync.forgeSubjects, this.sync.state.value, this.now);
    }
  }
  changeSetup(): void {
    this.draftMode = this.mode;
    this.draftLevel = this.sync.state.value.profile?.level ?? 'unsure';
    this.familiarity = this.sync.state.value.profile?.familiarity ?? 'studying';
    this.editing = true;
  }
  saveSetup(): void {
    if (!this.sync.ready || !['path', 'forge'].includes(this.draftMode) || ![...BANDS, 'unsure'].includes(this.draftLevel)) return;
    this.settingsNote=this.routine.choose(this.draftMode)
      ? 'Study preference saved for this browser. Completed work and review dates are preserved.'
      : 'Preference selected for this visit. Your learning progress is preserved.';
    if (this.draftMode === 'path') this.sync.updateProfile({...this.sync.state.value.profile, level: this.draftLevel, familiarity: this.familiarity, updatedAt: Date.now()});
    this.editing = false; this.refresh();
  }
  ngOnDestroy(): void { this.subscription?.unsubscribe(); if (this.timer) clearInterval(this.timer); }
}
