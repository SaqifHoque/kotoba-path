import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { KanjiCard, Rating, ReviewProgress, parseProgress, schedule } from './kanji-engine';
import { Exercise, Word, availableWords, buildVocabulary, mixedQueue, readingMatches, wordQueue } from './practice-engine';
import { Band, BANDS, estimatedBand } from './proficiency';
import { StudySyncService } from './study-sync.service';

@Component({selector: 'app-practice-studio', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './practice-studio.component.html', styleUrls: ['./practice-studio.component.scss']})
export class PracticeStudioComponent implements OnChanges, OnDestroy {
  @Input() cards: KanjiCard[] = [];
  @Input() kanji: ReviewProgress = {};
  @Input() assumed: string[] = [];
  @Input() target: Band = 'N5';
  @Output() kanjiRated = new EventEmitter<{card: KanjiCard; rating: Rating}>();
  words: Word[] = []; progress: ReviewProgress = {}; queue: Exercise[] = [];
  mode: 'vocabulary' | 'mixed' = 'vocabulary';
  answer = ''; checked = false; correct = false; message = ''; warning = '';
  private key = 'kotoba-vocabulary-reviews-v1';
  private subscription?: Subscription;
  private ranks = new Map<string, number>();
  constructor(public sync: StudySyncService) {}
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['cards']) {
      this.words = buildVocabulary(this.cards);
      this.ranks = new Map(this.cards.map(c=>[c.character,BANDS.indexOf(estimatedBand(c))]));
    }
    if (changes['cards'] || changes['target']) {
      const target = BANDS.indexOf(this.target);
      this.words.sort((a,b)=>this.distance(a,target)-this.distance(b,target));
      this.queue = []; this.resetAnswer();
    }
    if (!this.subscription) this.subscription = this.sync.state.subscribe(state=>this.progress=state.vocabulary);
  }
  private distance(word: Word, target: number): number {
    const rank = Math.max(0,...word.prerequisites.map(k=>this.ranks.get(k) ?? 4));
    return rank >= target ? rank-target : 10+target-rank;
  }
  get studyWords(): Word[] {
    const target = BANDS.indexOf(this.target);
    return this.words.filter(w=>this.progress[w.id] || Math.max(0,...w.prerequisites.map(k=>this.ranks.get(k) ?? 4)) >= target);
  }
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
    this.correct=e.kind==='reading'&&readingMatches(this.answer,e.word.reading); this.checked=true;
  }
  rate(rating: Rating): void {
    const e=this.exercise; if(!e||!this.checked||(e.kind==='reading'&&!this.correct&&rating!=='again'))return;
    if(e.kind==='kanji')this.kanjiRated.emit({card:e.card,rating});
    else {this.progress={...this.progress,[e.word.id]:schedule(this.progress[e.word.id],rating,Date.now())};this.save();}
    this.queue=this.queue.slice(1);this.resetAnswer();
    if(!this.queue.length)this.message='Session complete. Missed items return in 10 minutes; Hard tomorrow; Good follows your review schedule.';
  }
  private resetAnswer(): void {this.answer='';this.checked=false;this.correct=false;}
  private parse(raw: string|null): ReviewProgress {return parseProgress(raw,this.words.map(w=>({character:w.id})));}
  private save(): void {this.sync.updateVocabulary(this.progress);}
  export(): void {
    const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,cards:this.progress})],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='kotoba-vocabulary-progress.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async restore(event: Event): Promise<void> {
    const input=event.target as HTMLInputElement,file=input.files?.[0];if(!file)return;
    try {
      if(file.size>2000000)throw new Error('Too large');
      const data=this.parse(await file.text());
      this.progress={...this.progress};
      for(const [id,value] of Object.entries(data))if(!this.progress[id]||value.attempts>this.progress[id].attempts)this.progress[id]=value;
      this.save();this.queue=[];this.message='Vocabulary backup restored.';
    }catch{this.message='Invalid vocabulary backup. Your progress has not changed.';}
    input.value='';
  }
  ngOnDestroy(): void {this.subscription?.unsubscribe();}
}
