import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { StudySyncService } from './study-sync.service';
import { buildLevels, dueCards, KanjiCard, KanjiLevel, levelDone, parseProgress, Rating, ReviewProgress, schedule, unlocked } from './kanji-engine';

@Component({selector: 'app-kanji-path', standalone: true, imports: [CommonModule],
  templateUrl: './kanji-path.component.html', styleUrls: ['./kanji-path.component.scss']})
export class KanjiPathComponent implements OnInit, OnDestroy {
  cards: KanjiCard[] = []; levels: KanjiLevel[] = []; progress: ReviewProgress = {};
  loading = true; error = ''; page = 0; now = Date.now();
  mode: 'path' | 'review' = 'path'; queue: KanjiCard[] = []; session = false;
  revealed = false; practice = false; sessionTitle = ''; message = ''; answered = 0;
  private syncSubscription?: Subscription;
  private timer?: ReturnType<typeof setInterval>;
  constructor(private readonly http: HttpClient, public readonly sync: StudySyncService) {}
  ngOnInit(): void { this.load(); this.timer = setInterval(() => this.now = Date.now(), 10000); }
  ngOnDestroy(): void { if (this.timer) clearInterval(this.timer); this.syncSubscription?.unsubscribe(); }
  load(): void {
    this.loading = true; this.error = '';
    this.http.get<KanjiCard[]>('assets/kanji-curriculum.json').subscribe({
      next: cards => {
        try { this.levels = buildLevels(cards); this.cards = cards; }
        catch { this.error = 'The kanji curriculum could not be read. Please retry.'; this.loading = false; return; }
        this.sync.initialize(cards);
        this.syncSubscription?.unsubscribe();
        this.syncSubscription = this.sync.state.subscribe(state => this.progress = state.kanji);
        this.page = Math.floor((this.nextLevel - 1) / 10); this.loading = false;
      },
      error: () => { this.loading = false; this.error = 'Could not load the kanji catalog. Check your connection and retry.'; }
    });
  }
  get completed(): number { return this.levels.filter(l => this.done(l)).length; }
  get learned(): number { return this.cards.filter(c => this.progress[c.character]?.learned).length; }
  get nextLevel(): number { return this.levels.find(l => !this.done(l))?.number ?? this.levels.length; }
  get due(): KanjiCard[] { return dueCards(this.cards, this.progress, this.now); }
  get nextReview(): number | undefined {
    const dates = Object.values(this.progress).map(p => p.due).filter(d => d > this.now);
    return dates.length ? Math.min(...dates) : undefined;
  }
  get visibleLevels(): KanjiLevel[] { return this.levels.slice(this.page * 10, this.page * 10 + 10); }
  get pageCount(): number { return Math.ceil(this.levels.length / 10); }
  get card(): KanjiCard | undefined { return this.queue[0]; }
  done(level: KanjiLevel): boolean { return levelDone(level, this.progress); }
  locked(level: KanjiLevel): boolean { return !unlocked(this.levels, level.number - 1, this.progress); }
  count(level: KanjiLevel): number { return level.cards.filter(c => this.progress[c.character]?.learned).length; }
  trackLevel(_: number, level: KanjiLevel): number { return level.number; }
  goCurrent(): void { this.page = Math.floor((this.nextLevel - 1) / 10); }
  changeMode(mode: 'path' | 'review'): void { this.mode = mode; this.session = false; this.queue = []; this.message = ''; }
  start(level: KanjiLevel): void {
    if (this.locked(level)) return;
    this.practice = this.done(level);
    this.queue = this.practice ? [...level.cards] : level.cards.filter(c => !this.progress[c.character]?.learned);
    this.begin(`${this.practice ? 'Practice' : 'Level'} ${level.number}`);
  }
  startReview(): void {
    this.now = Date.now(); this.practice = false; this.queue = this.due.slice(0, 20);
    if (this.queue.length) this.begin('Repetition · due kanji');
  }
  private begin(title: string): void {
    this.sessionTitle = title; this.session = true; this.revealed = false; this.answered = 0; this.message = '';
  }
  rate(rating: Rating): void {
    const card = this.card;
    if (!card || !this.revealed) return;
    this.now = Date.now();
    if (!this.practice) {
      this.progress = {...this.progress, [card.character]: schedule(this.progress[card.character], rating, this.now)};
      this.save();
    }
    this.queue = this.queue.slice(1);
    if (rating === 'again' && this.mode === 'path') this.queue.push(card);
    this.revealed = false; this.answered++;
    if (!this.queue.length) {
      this.session = false;
      this.message = this.practice ? 'Practice complete. Your review dates are unchanged.' :
        this.sync.warning ? 'Session complete. Export a backup to keep this progress.' : 'Session complete. Check sync status above and return for your scheduled reviews.';
    }
  }
  interval(rating: Rating): string {
    if (this.practice) return rating === 'again' ? 'Try again this session' : 'Practice only';
    const next = schedule(this.card ? this.progress[this.card.character] : undefined, rating, this.now);
    const minutes = Math.round((next.due - this.now) / 60000);
    return minutes < 60 ? `${minutes} min` : `${Math.round(minutes / 1440)} day(s)`;
  }
  private save(): void {
    this.sync.update(this.progress);
  }
  exportProgress(): void {
    const url = URL.createObjectURL(new Blob([JSON.stringify({version: 1, cards: this.progress})], {type: 'application/json'}));
    const a = document.createElement('a'); a.href = url; a.download = 'kotoba-kanji-progress.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async importProgress(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement, file = input.files?.[0];
    if (!file) return;
    try {
      if (file.size > 2000000) throw new Error('Too large');
      const restored = parseProgress(await file.text(), this.cards);
      this.sync.restore(restored); this.session = false; this.queue = [];
      this.message = 'Progress backup restored.';
    } catch { this.message = 'This backup could not be read. Your progress has not changed.'; }
    input.value = '';
  }
}
