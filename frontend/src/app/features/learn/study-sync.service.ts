import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, timeout } from 'rxjs';
import { KanjiCard, ReviewProgress, parseProgress } from './kanji-engine';
import { mergeReviews } from './study-progress';
import { BANDS, Proficiency } from './proficiency';

interface StudyState { revision: number; profile: Proficiency | null; kanji: ReviewProgress; }

@Injectable({providedIn: 'root'})
export class StudySyncService {
  readonly state = new BehaviorSubject<StudyState>({revision: 0, profile: null, kanji: {}});
  status = 'Connecting to database…';
  warning = '';
  ready = false;
  private readonly key = 'kotoba-kanji-reviews-v1';
  private readonly profileKey = 'kotoba-proficiency-v1';
  private cards: KanjiCard[] = [];
  private initialized = false;
  private canCache = true;
  private saving = false;
  private dirty = false;
  private connected = false;
  private version = 0;

  constructor(private readonly http: HttpClient) {}

  initialize(cards: KanjiCard[]): void {
    if (this.initialized) return;
    this.initialized = true;
    this.cards = cards;
    try {
      this.state.next({revision: 0, profile: this.parseProfile(localStorage.getItem(this.profileKey)), kanji: parseProgress(localStorage.getItem(this.key), cards)});
    }
    catch {
      this.canCache = false;
      this.warning = 'Browser progress could not be read. The existing backup is preserved; export a backup to keep new progress.';
    }
    void this.retry();
  }

  update(kanji: ReviewProgress): void {
    this.version++;
    this.state.next({...this.state.value, kanji});
    this.dirty = true;
    this.cache();
    void this.flush();
  }

  updateProfile(profile: Proficiency): void {
    this.version++;
    this.state.next({...this.state.value, profile});
    this.dirty = true;
    this.cache();
    void this.flush();
  }

  restore(kanji: ReviewProgress): void {
    this.canCache = true;
    this.warning = '';
    this.update(mergeReviews(this.state.value.kanji, kanji));
  }

  async retry(): Promise<void> {
    if (this.saving || !this.initialized) return;
    this.saving = true;
    this.status = 'Connecting to database…';
    try {
      this.merge(await firstValueFrom(this.http.get<StudyState>('/api/study-profile').pipe(timeout(10000))));
      this.connected = true;
      this.dirty = true;
    } catch {
      this.connected = false;
      this.status = 'Database unavailable. Keep your browser backup and retry to sync.';
    } finally { this.saving = false; this.ready = true; }
    if (this.connected) await this.flush();
  }

  private merge(remote: StudyState): void {
    if (!Number.isSafeInteger(remote.revision) || remote.revision < 0) throw new Error('Invalid revision');
    const restored = parseProgress(JSON.stringify({version: 1, cards: remote.kanji}), this.cards);
    const profile = this.validProfile(remote.profile);
    const currentProfile = this.state.value.profile;
    this.state.next({revision: remote.revision,
      profile: !currentProfile || (profile && profile.updatedAt > currentProfile.updatedAt) ? profile : currentProfile,
      kanji: mergeReviews(this.state.value.kanji, restored)});
    this.cache();
  }

  private parseProfile(value: string | null): Proficiency | null {
    if (!value) return null;
    return this.validProfile(JSON.parse(value));
  }

  private validProfile(value: unknown): Proficiency | null {
    if (!value || typeof value !== 'object') return null;
    const profile = value as Proficiency;
    if (![...BANDS, 'unsure'].includes(profile.level) || !['studying', 'comfortable'].includes(profile.familiarity)
        || !Number.isSafeInteger(profile.updatedAt) || profile.updatedAt < 0) return null;
    const result: Proficiency = {level: profile.level, familiarity: profile.familiarity, updatedAt: profile.updatedAt};
    const placement = profile.placement;
    if (placement && placement.total === 5 && Number.isInteger(placement.correct) && placement.correct >= 0
        && placement.correct <= 5 && BANDS.includes(placement.suggested)) result.placement = placement;
    return result;
  }

  private cache(): void {
    if (!this.canCache) return;
    try {
      localStorage.setItem(this.key, JSON.stringify({version: 1, cards: this.state.value.kanji}));
      localStorage.setItem(this.profileKey, JSON.stringify(this.state.value.profile));
    }
    catch { this.warning = 'Browser backup could not be saved. Export progress or wait for a successful database save.'; }
  }

  private async flush(): Promise<void> {
    if (this.saving || !this.connected) return;
    this.saving = true;
    let conflicts = 0;
    try {
      while (this.dirty) {
        this.dirty = false;
        const version = this.version;
        this.status = 'Saving to database…';
        try {
          const response = await firstValueFrom(this.http.put<{revision: number}>('/api/study-profile', this.state.value).pipe(timeout(10000)));
          this.state.next({...this.state.value, revision: response.revision});
          if (version !== this.version) this.dirty = true;
        } catch (error: unknown) {
          if ((error as {status?: number}).status === 409 && conflicts++ < 2) {
            this.merge(await firstValueFrom(this.http.get<StudyState>('/api/study-profile').pipe(timeout(10000))));
            this.dirty = true;
          } else throw error;
        }
      }
      this.status = 'Saved to database';
    } catch {
      this.dirty = true;
      this.connected = false;
      this.status = 'Database sync failed. Keep your browser backup and retry to sync.';
    } finally { this.saving = false; }
  }
}
