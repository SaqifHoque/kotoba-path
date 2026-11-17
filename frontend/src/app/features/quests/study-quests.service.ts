import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom, timeout } from 'rxjs';
import { AccountService } from '../account/account.service';
import { ChapterProgressService } from '../chapters/chapter-progress.service';
import { StudySyncService } from '../learn/study-sync.service';
import { DEMO_MODE } from '../../demo-mode';
import { ActivityWindow, activityWindow, parseActivity, pendingCandidates, questProgress, studyBadges } from './study-quests';

@Injectable({providedIn:'root'})
export class StudyQuestsService {
  readonly demo = DEMO_MODE;
  loading = false;
  lastUpdated = 0;
  deviceOnly = false;
  window?: ActivityWindow;
  result?: ReturnType<typeof questProgress>;
  private owner?: string;
  private request = 0;
  constructor(private readonly http: HttpClient, private readonly account: AccountService,
      private readonly sync: StudySyncService, private readonly chapters: ChapterProgressService) {}
  get ready() { return this.sync.ready && !this.account.changing; }
  get visible() { return this.ready && this.owner === this.account.account.id && this.window?.day === activityWindow(Date.now()).day; }
  get badges() { return studyBadges(this.sync.state.value.forge,this.chapters.snapshot()); }
  async refresh(force = false): Promise<void> {
    if (!this.ready || (this.loading && !force)) return;
    const request = ++this.request;
    const owner = this.account.account.id;
    const window = activityWindow(Date.now());
    const pending = pendingCandidates(this.sync.pendingReviewEvents,window);
    this.loading = true;
    let activity;
    let deviceOnly = DEMO_MODE;
    try {
      if (!DEMO_MODE) {
        let params = new HttpParams().set('from',window.from).set('to',window.to);
        if (pending.length) params = params.set('pendingIds',pending.map(e=>e.id).join(','));
        activity = parseActivity(await firstValueFrom(this.http.get<unknown>('/api/study-profile/activity',{params}).pipe(timeout(10000))),window);
      }
    } catch { deviceOnly = true; }
    finally {
      if (request === this.request) this.loading = false;
    }
    if (request !== this.request || !this.ready || owner !== this.account.account.id ||
        window.day !== activityWindow(Date.now()).day) return;
    this.window = window; this.owner = owner; this.deviceOnly = deviceOnly;
    this.result = questProgress(window,pending,activity); this.lastUpdated = Date.now();
  }
}
