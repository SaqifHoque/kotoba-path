import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { KanjiCard } from '../learn/kanji-engine';
import { Word, buildVocabulary } from '../learn/practice-engine';
import { StudySyncService } from '../learn/study-sync.service';
import { DailyPlan, StudyAction, StudyView, dailyPlan } from '../home/study-home';
import { OpenSession, LearningMilestone, isReviewAction, learningMilestones, nextLesson } from './study-overview';
import { StudyRoutineService } from './study-routine.service';
import { StarterChapterComponent } from '../chapters/starter-chapter.component';
import { DEMO_MODE } from '../../demo-mode';

@Component({selector:'app-study-hub',standalone:true,imports:[CommonModule, StarterChapterComponent],
  templateUrl:'./study-hub.component.html',styleUrls:['./study-hub.component.scss']})
export class StudyHubComponent implements OnInit, OnChanges, OnDestroy {
  @Input() sessions: OpenSession[] = [];
  @Output() resume = new EventEmitter<OpenSession>();
  @Input() cards: KanjiCard[] = [];
  @Input() section: 'learning' | 'reviews' | 'library' = 'learning';
  @Output() start = new EventEmitter<StudyAction>();
  @Output() open = new EventEmitter<StudyView>();
  readonly demo = DEMO_MODE;
  plan?: DailyPlan; milestones: LearningMilestone[] = []; notice='';
  private words: Word[] = []; private subscription?: Subscription; private timer?: ReturnType<typeof setInterval>;
  constructor(public readonly sync: StudySyncService, public readonly routine: StudyRoutineService) {}
  ngOnInit(): void { this.subscription=this.sync.state.subscribe(()=>this.refresh());this.timer=setInterval(()=>this.refresh(),10000); }
  ngOnChanges(changes: SimpleChanges): void { if(changes['cards'])this.words=buildVocabulary(this.cards);if(changes['cards']||changes['section'])this.refresh(); }
  get mode() { return this.routine.mode(this.sync.state.value); }
  get lesson() { return this.plan?nextLesson(this.plan,this.mode):null; }
  get review() { return this.plan?.next&&isReviewAction(this.plan.next.action)?this.plan.next:null; }
  choose(mode:'path'|'forge'): void {
    this.notice=this.routine.choose(mode)?'Lesson preference saved. Your completed work and review dates are preserved.':'Preference selected for this visit. Your learning progress is preserved.';
    this.refresh();
  }
  private refresh(): void {
    if(!this.cards.length)return;
    this.plan=dailyPlan(this.cards,this.words,this.sync.forgeSubjects,this.sync.state.value,this.mode,Date.now());
    this.milestones=learningMilestones(this.cards,this.sync.forgeSubjects,this.sync.state.value);
  }
  ngOnDestroy(): void { this.subscription?.unsubscribe();if(this.timer)clearInterval(this.timer); }
}
