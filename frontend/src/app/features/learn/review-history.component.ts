import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { HistoryPage } from './review-history';
import { StudySyncService } from './study-sync.service';

@Component({selector: 'app-review-history', standalone: true, imports: [CommonModule],
  templateUrl: './review-history.component.html', styleUrls: ['./review-history.component.scss']})
export class ReviewHistoryComponent implements OnInit {
  events: HistoryPage['events'] = [];
  total = 0; scheduled = 0; remembered = 0; cursor: string | null = null;
  loading = false; error = ''; loaded = false;
  constructor(private readonly http: HttpClient, public readonly sync: StudySyncService) {}
  ngOnInit(): void { void this.load(); }
  async load(older = false): Promise<void> {
    if (this.loading || (older && !this.cursor)) return;
    this.loading = true; this.error = '';
    try {
      // The shared app catalog initializes the profile independently of the active view.
      const deadline = Date.now() + 11000;
      while (!this.sync.ready && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
      let params = new HttpParams().set('limit', 50);
      if (older && this.cursor) params = params.set('before', this.cursor);
      const page = await firstValueFrom(this.http.get<HistoryPage>('/api/study-profile/reviews', {params}).pipe(timeout(10000)));
      this.events = older ? [...this.events, ...page.events] : page.events;
      this.cursor = page.nextCursor ?? null;
      this.total = page.total; this.scheduled = page.scheduled; this.remembered = page.remembered; this.loaded = true;
    } catch { this.error = 'History could not be loaded. Check your connection or reload after signing in.'; }
    finally { this.loading = false; }
  }
  get recall(): number { return Math.round(this.remembered / Math.max(1, this.scheduled) * 100); }
  track(_: number, event: HistoryPage['events'][number]): string { return event.id; }
  outcome(value: string): string {
    return ({good: 'Good', hard: 'Hard', again: 'Again', correct: 'Correct', incorrect: 'Incorrect'} as Record<string, string>)[value] ?? value;
  }
}
