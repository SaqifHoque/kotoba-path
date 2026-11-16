import { Injectable } from '@angular/core';
import { AccountService } from '../account/account.service';
import { StudySyncService } from '../learn/study-sync.service';
import { STARTER_CHAPTER } from './starter-chapter';
import { ChapterProgress, chapterProgress } from './chapter-progress';

/** Derived only: imports, sync updates and review lapses immediately change the view. */
@Injectable({providedIn:'root'})
export class ChapterProgressService {
  readonly chapter = STARTER_CHAPTER;
  constructor(private readonly sync: StudySyncService, private readonly account: AccountService) {}
  get ready(): boolean { return this.sync.ready && !this.account.changing; }
  snapshot(now = Date.now()): ChapterProgress | null {
    if (!this.ready) return null;
    const known = new Set(this.sync.forgeSubjects.map(s => s.id));
    const ids = [...this.chapter.kanji.map(k=>k.subjectId), ...this.chapter.words.map(w=>w.id)];
    if (ids.some(id=>!known.has(id))) return null;
    return chapterProgress(this.chapter, this.sync.state.value.forge, now);
  }
}
