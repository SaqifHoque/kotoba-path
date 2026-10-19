import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AccountService } from '../account/account.service';
import { KanjiCard } from '../learn/kanji-engine';
import { Band, BANDS, targetBand } from '../learn/proficiency';
import { Word, buildVocabulary } from '../learn/practice-engine';
import { StudySyncService } from '../learn/study-sync.service';
import { DailyPlan, HomePreference, StudyAction, StudyMode, StudyView, dailyPlan, hasStudyProgress, parseHomePreference, preferredMode } from './study-home';

@Component({selector: 'app-study-home', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './study-home.component.html', styleUrls: ['./study-home.component.scss']})
export class StudyHomeComponent implements OnInit, OnChanges, OnDestroy {
  @Input() cards: KanjiCard[] = [];
  @Output() start = new EventEmitter<StudyAction>();
  @Output() open = new EventEmitter<StudyView>();
  now = Date.now(); plan?: DailyPlan; bands = BANDS;
  editing = false; draftMode: StudyMode = 'path'; draftLevel: Band | 'unsure' = 'unsure';
  familiarity: 'studying' | 'comfortable' = 'studying'; settingsNote = '';
  private preference: HomePreference | null = null;
  private words: Word[] = [];
  private subscription?: Subscription; private timer?: ReturnType<typeof setInterval>;
  constructor(public readonly sync: StudySyncService, public readonly account: AccountService) {}
  ngOnInit(): void {
    try { this.preference = parseHomePreference(localStorage.getItem(this.account.cacheKey('kotoba-study-home-v1'))); }
    catch { this.settingsNote = 'Your study setup could not be read. Choose a routine again; your progress is preserved.'; }
    this.subscription = this.sync.state.subscribe(() => this.refresh());
    this.timer = setInterval(() => { this.now = Date.now(); this.refresh(); }, 10000);
  }
  ngOnChanges(): void { this.words = buildVocabulary(this.cards); this.refresh(); }
  get mode(): StudyMode { return preferredMode(this.sync.state.value, this.preference); }
  get target(): Band { return targetBand(this.sync.state.value.profile); }
  get setupVisible(): boolean { return this.editing || (this.sync.ready && !this.preference && !hasStudyProgress(this.sync.state.value)); }
  private refresh(): void {
    if (this.cards.length) this.plan = dailyPlan(this.cards, this.words, this.sync.forgeSubjects, this.sync.state.value, this.mode, this.now);
  }
  changeSetup(): void {
    this.draftMode = this.mode;
    this.draftLevel = this.sync.state.value.profile?.level ?? 'unsure';
    this.familiarity = this.sync.state.value.profile?.familiarity ?? 'studying';
    this.editing = true;
  }
  saveSetup(): void {
    if (!this.sync.ready || !['path', 'forge'].includes(this.draftMode) || ![...BANDS, 'unsure'].includes(this.draftLevel)) return;
    this.preference = {version: 1, mode: this.draftMode};
    try {
      localStorage.setItem(this.account.cacheKey('kotoba-study-home-v1'), JSON.stringify(this.preference));
      this.settingsNote = 'Study routine saved for this browser. Completed work and review dates are preserved.';
    } catch { this.settingsNote = 'This routine is selected for this visit. Browser settings could not be saved; your study progress is preserved.'; }
    if (this.draftMode === 'path') this.sync.updateProfile({...this.sync.state.value.profile, level: this.draftLevel, familiarity: this.familiarity, updatedAt: Date.now()});
    this.editing = false; this.refresh();
  }
  ngOnDestroy(): void { this.subscription?.unsubscribe(); if (this.timer) clearInterval(this.timer); }
}
