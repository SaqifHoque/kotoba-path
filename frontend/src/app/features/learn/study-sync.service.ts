import { DEMO_MODE } from '../../demo-mode';
import { saveStatus } from '../settings/save-status';
import { Injectable } from '@angular/core';
import { AccountService } from '../account/account.service';
import { ReviewAttempt, ReviewOutbox } from './review-history';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, timeout } from 'rxjs';
import { KanjiCard, ReviewProgress, parseProgress } from './kanji-engine';
import { mergeReviews } from './study-progress';
import { BANDS, Proficiency } from './proficiency';
import { buildVocabulary } from './practice-engine';
import { ForgeState, Subject, buildForge, emptyForge, mergeForge, parseForge } from '../forge/forge-engine';

interface StudyState { revision: number; profile: Proficiency | null; kanji: ReviewProgress; vocabulary: ReviewProgress; forge: ForgeState; }

@Injectable({providedIn: 'root'})
export class StudySyncService {
  readonly state = new BehaviorSubject<StudyState>({revision: 0, profile: null, kanji: {}, vocabulary: {}, forge: emptyForge()});
  forgeSubjects: Subject[] = [];
  private phase: 'connecting' | 'saving' | 'idle' = 'connecting';
  private localSaved = false;
  get saveStatus() {
    return saveStatus({ready:this.ready,phase:this.phase,connected:this.connected,dirty:this.dirty,localSaved:this.localSaved,
      pendingHistory:this.pendingHistory,historyWarning:!!this.outbox?.warning,signedIn:!!this.auth.account.username,demo:DEMO_MODE,changing:this.auth.changing});
  }
  get status(): string { return this.saveStatus.message; }
  warning = '';
  ready = false;
  private readonly key = 'kotoba-kanji-reviews-v1';
  private readonly profileKey = 'kotoba-proficiency-v1';
  private readonly vocabularyKey = 'kotoba-vocabulary-reviews-v1';
  private readonly forgeKey = 'kotoba-forge-v1';
  private cards: KanjiCard[] = [];
  private words: {character: string}[] = [];
  private initialized = false;
  private canCache = true;
  private saving = false;
  private dirty = false;
  private connected = false;
  private version = 0;
  private outbox?: ReviewOutbox;
  get pendingHistory(): number { return this.outbox?.batch(Number.MAX_SAFE_INTEGER).length ?? 0; }

  constructor(private readonly http: HttpClient, private readonly auth: AccountService) {}

  initialize(cards: KanjiCard[]): void {
    if (this.initialized) return;
    this.initialized = true;
    this.cards = cards;
    this.words = buildVocabulary(cards).map(word => ({character: word.id}));
    this.forgeSubjects = buildForge(cards);
    let storage: Storage | null = null;
    try { storage = localStorage; } catch { /* Keep unsynced attempts in memory if storage is blocked. */ }
    this.outbox = new ReviewOutbox(storage, this.auth.cacheKey('kotoba-review-event-v1:'));
    this.outbox.batch();
    try {
      this.state.next({revision: 0, profile: this.parseProfile(localStorage.getItem(this.auth.cacheKey(this.profileKey))),
        kanji: parseProgress(localStorage.getItem(this.auth.cacheKey(this.key)), cards),
        vocabulary: parseProgress(localStorage.getItem(this.auth.cacheKey(this.vocabularyKey)), this.words),
        forge: parseForge(JSON.parse(localStorage.getItem(this.auth.cacheKey(this.forgeKey)) || 'null'), this.forgeSubjects)});
    }
    catch {
      this.canCache = false;
      this.warning = 'Saved device progress could not be read. The original copy is preserved. Keep this tab open and download learning data from Settings.';
    }
    void this.retry();
  }

  update(kanji: ReviewProgress, attempt?: ReviewAttempt): void {
    this.capture(attempt);
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

  updateVocabulary(vocabulary: ReviewProgress, attempt?: ReviewAttempt): void {
    this.capture(attempt);
    this.version++;
    this.state.next({...this.state.value, vocabulary});
    this.dirty = true;
    this.cache();
    void this.flush();
  }

  updateForge(forge: ForgeState, attempt?: ReviewAttempt): void {
    this.capture(attempt);
    this.version++;
    this.state.next({...this.state.value, forge});
    this.dirty = true;
    this.cache();
    void this.flush();
  }

  private capture(attempt?: ReviewAttempt): void {
    if (!attempt) return;
    if (!this.outbox) throw new Error('Study history has not initialized');
    this.outbox.add({...attempt, id: crypto.randomUUID()});
    if (this.outbox.warning) this.warning = this.outbox.warning;
  }

  restore(kanji: ReviewProgress): void {
    this.canCache = true;
    this.warning = '';
    this.update(mergeReviews(this.state.value.kanji, kanji));
  }

  async retry(): Promise<void> {
    if (this.saving || !this.initialized) return;
    if (DEMO_MODE) { this.cache(); this.ready = true; this.phase = 'idle'; return; }
    this.saving = true;
    this.phase = 'connecting';
    try {
      if (!this.auth.available) {
        const previous = this.auth.account.id;
        await this.auth.initialize();
        if (!this.auth.available) throw new Error('Account unavailable');
        if (previous !== this.auth.account.id) { window.location.reload(); return; }
      }
      this.merge(await firstValueFrom(this.http.get<StudyState>('/api/study-profile').pipe(timeout(10000))));
      this.connected = true;
      this.dirty = true;
    } catch {
      this.connected = false;
      this.cache();
    } finally { this.saving = false; this.ready = true; this.phase = 'idle'; }
    if (this.connected) await this.flush();
  }

  private merge(remote: StudyState): void {
    if (!Number.isSafeInteger(remote.revision) || remote.revision < 0) throw new Error('Invalid revision');
    const restored = parseProgress(JSON.stringify({version: 1, cards: remote.kanji}), this.cards);
    const vocabulary = parseProgress(JSON.stringify({version: 1, cards: remote.vocabulary ?? {}}), this.words);
    const forge = parseForge(remote.forge, this.forgeSubjects);
    const profile = this.validProfile(remote.profile);
    const currentProfile = this.state.value.profile;
    this.state.next({revision: remote.revision,
      profile: !currentProfile || (profile && profile.updatedAt > currentProfile.updatedAt) ? profile : currentProfile,
      kanji: mergeReviews(this.state.value.kanji, restored),
      vocabulary: mergeReviews(this.state.value.vocabulary, vocabulary),
      forge: mergeForge(this.state.value.forge, forge)});
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
    if (this.outbox?.warning) this.warning = this.outbox.warning;
    if (!this.canCache) { this.localSaved = false; return; }
    try {
      localStorage.setItem(this.auth.cacheKey(this.key), JSON.stringify({version: 1, cards: this.state.value.kanji}));
      localStorage.setItem(this.auth.cacheKey(this.profileKey), JSON.stringify(this.state.value.profile));
      localStorage.setItem(this.auth.cacheKey(this.vocabularyKey), JSON.stringify({version: 1, cards: this.state.value.vocabulary}));
      localStorage.setItem(this.auth.cacheKey(this.forgeKey), JSON.stringify(this.state.value.forge));
      this.localSaved = true;
      if (this.warning.startsWith('A complete device copy could not be saved.')) this.warning = this.outbox?.warning || '';
    }
    catch { this.localSaved = false; this.warning = 'A complete device copy could not be saved. Keep this tab open and download learning data from Settings, or wait for an account save.'; }
  }

  async prepareAccountChange(requireSaved = false): Promise<void> {
    if (this.auth.changing) throw new Error('An account change is already in progress.');
    this.auth.changing = true;
    const deadline = Date.now() + 12000;
    while (this.saving && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
    if (this.saving) throw new Error('A save is still running. Wait and retry.');
    if (requireSaved) {
      if (!this.connected || !this.ready) throw new Error('Connect and save your learning path before creating an account.');
      await this.flush();
      if (this.dirty || !this.connected) throw new Error('Save your current progress before creating an account.');
    }
    this.connected = false;
  }

  cancelAccountChange(): void {
    this.auth.changing = false;
    void this.retry();
  }

  private async flush(): Promise<void> {
    if (this.saving || !this.connected) return;
    this.saving = true;
    let conflicts = 0;
    try {
      while (this.dirty || this.pendingHistory) {
        const events = this.outbox?.batch() ?? [];
        this.dirty = false;
        const version = this.version;
        this.phase = 'saving';
        try {
          const response = await firstValueFrom(this.http.put<{revision: number; acknowledgedEvents?: string[]}>('/api/study-profile', {...this.state.value, reviewEvents: events}).pipe(timeout(10000)));
          if (!Number.isSafeInteger(response.revision) || response.revision < 0) throw new Error('Save response was invalid');
          this.state.next({...this.state.value, revision: response.revision});
          const acknowledged = response.acknowledgedEvents ?? [];
          if (events.some(event => !acknowledged.includes(event.id))) throw new Error('History save was not acknowledged');
          this.outbox?.acknowledge(events.map(event => event.id));
          if (version !== this.version) this.dirty = true;
        } catch (error: unknown) {
          if ((error as {status?: number}).status === 409 && conflicts++ < 2) {
            this.merge(await firstValueFrom(this.http.get<StudyState>('/api/study-profile').pipe(timeout(10000))));
            this.dirty = true;
          } else throw error;
        }
      }
      this.phase = 'idle';
    } catch {
      this.dirty = true;
      this.connected = false;
      this.phase = 'idle';
    } finally { this.saving = false; this.phase = 'idle'; }
  }
}
