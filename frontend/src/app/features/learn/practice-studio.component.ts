import { checkReading } from './answer-checker';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { KanjiCard, Rating, ReviewProgress, schedule } from './kanji-engine';
import { Exercise, Word, availableWords, buildVocabulary, mixedQueue, targetedVocabulary, wordQueue } from './practice-engine';
import { Band } from './proficiency';
import { StudySyncService } from './study-sync.service';
import { recallAttempt, ReviewAttempt } from './review-history';

@Component({selector: 'app-practice-studio', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './practice-studio.component.html', styleUrls: ['./practice-studio.component.scss']})
export class PracticeStudioComponent implements OnChanges, OnDestroy {
  @Input() cards: KanjiCard[] = [];
  @Input() kanji: ReviewProgress = {};
  @Input() assumed: string[] = [];
  @Input() target: Band = 'N5';
  @Input() autoStart = false;
  @Output() kanjiRated = new EventEmitter<{card: KanjiCard; rating: Rating}>();
  words: Word[] = []; progress: ReviewProgress = {}; queue: Exercise[] = [];
  mode: 'vocabulary' | 'mixed' = 'vocabulary';
  feedback = ''; answer = ''; checked = false; correct = false; message = ''; warning = '';
  private key = 'kotoba-vocabulary-reviews-v1';
  private subscription?: Subscription;
  constructor(public sync: StudySyncService) {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cards']) {
      this.words = buildVocabulary(this.cards);
    }
    if (changes['cards'] || changes['target']) {
      this.queue = []; this.resetAnswer();
    }
    if (!this.subscription) this.subscription = this.sync.state.subscribe(state=>this.progress=state.vocabulary);
    if (this.autoStart && this.sync.ready && (changes['cards'] || changes['autoStart'])) this.start();
  }
  get studyWords(): Word[] { return targetedVocabulary(this.cards,this.words,this.progress,this.target); }
  get available(): Word[] { return availableWords(this.studyWords,this.kanji,this.assumed); }
  get pending(): Word[] { return wordQueue(this.available,this.progress,Date.now()); }
  get introduced(): number { return this.words.filter(w=>this.progress[w.id]?.learned).length; }
  get exercise(): Exercise | undefined { return this.queue[0]; }
  get prompt(): string { const e=this.exercise; return !e?'':e.kind==='kanji'?e.card.character:e.kind==='meaning'&&e.word.context?e.word.context[0]:e.word.text; }
  get solution(): string {
    const e=this.exercise;
    return !e?'':e.kind==='kanji'?`${e.card.meaning} · ${e.card.onyomi} · ${e.card.kunyomi}`:
      `${e.word.reading} · ${e.word.meaning}${e.kind==='meaning'&&e.word.context?' · '+e.word.context[1]:''}`;
  }
  setMode(mode: 'vocabulary'|'mixed'): void { this.mode=mode; this.queue=[]; this.message=''; this.resetAnswer(); }
  start(): void {
    this.queue=this.mode==='mixed'?mixedQueue(this.cards,this.kanji,this.studyWords,this.progress,Date.now(),this.assumed):
      this.pending.slice(0,10).map(word=>({kind:'reading',word}));
    this.resetAnswer(); this.message=this.queue.length?'':'You’re caught up. Learn recommended kanji to unlock more words.';
  }
  check(): void {
    const e=this.exercise; if(!e||this.checked)return;
    if(e.kind==='reading') {
      const result=checkReading(this.answer,[e.word.reading]);
      this.feedback=result.message;
      this.correct=result.status==='correct';
      this.checked=result.status!=='retry';
    } else this.checked=true;
  }
  rate(rating: Rating): void {
    const e=this.exercise; if(!e||!this.checked||(e.kind==='reading'&&!this.correct&&rating!=='again'))return;
    if(e.kind==='kanji')this.kanjiRated.emit({card:e.card,rating});
    else {
      const previous = this.progress[e.word.id], now = Date.now();
      this.progress={...this.progress,[e.word.id]:schedule(previous,rating,now)};
      this.save(recallAttempt('vocabulary',e.word.id,e.word.text,e.kind,rating,previous,now));
    }
    this.queue=this.queue.slice(1);this.resetAnswer();
    if(!this.queue.length)this.message='Session complete. Missed items return in 10 minutes; Hard tomorrow; Good follows your review schedule.';
  }
  private resetAnswer(): void {this.feedback='';this.answer='';this.checked=false;this.correct=false;}
  private save(attempt?: ReviewAttempt): void {this.sync.updateVocabulary(this.progress, attempt);}
  ngOnDestroy(): void {this.subscription?.unsubscribe();}
}
