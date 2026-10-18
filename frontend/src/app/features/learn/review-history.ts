import { Rating, ReviewState } from './kanji-engine';

export interface ReviewAttempt {
  mode: 'kanji' | 'vocabulary' | 'forge'; subject: string; label: string;
  skill: 'both' | 'meaning' | 'reading'; kind: 'learning' | 'scheduled';
  outcome: Rating | 'correct' | 'incorrect'; occurredAt: number;
}
export interface ReviewEvent extends ReviewAttempt { id: string; }
export interface HistoryPage {
  events: (ReviewEvent & {sequence: string; receivedAt: number})[];
  nextCursor: string | null; total: number; scheduled: number; remembered: number;
}
export function recallAttempt(mode: 'kanji' | 'vocabulary', subject: string, label: string,
    skill: ReviewAttempt['skill'], outcome: Rating, previous: ReviewState | undefined, now: number): ReviewAttempt {
  return {mode, subject, label, skill, outcome, kind: previous?.learned && previous.due <= now ? 'scheduled' : 'learning', occurredAt: now};
}
export function parseEvent(value: unknown): ReviewEvent {
  const e = value as ReviewEvent;
  if (!e || typeof e !== 'object' || Object.keys(e).length !== 8 || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(e.id)
      || !['kanji', 'vocabulary', 'forge'].includes(e.mode) || !['both', 'meaning', 'reading'].includes(e.skill)
      || !['learning', 'scheduled'].includes(e.kind)
      || !(e.mode === 'forge' ? ['correct', 'incorrect'] : ['again', 'hard', 'good']).includes(e.outcome)
      || !Number.isSafeInteger(e.occurredAt) || e.occurredAt < 0 || e.occurredAt > 8640000000000000
      || [e.subject, e.label].some(s => typeof s !== 'string' || !s.trim() || s.length > 200)
      || (e.mode === 'kanji' && [...e.subject].length !== 1) || (e.mode === 'forge' && !/^[rkv]:.{1,198}$/u.test(e.subject))) {
    throw new Error('Invalid review attempt');
  }
  return {id: e.id, mode: e.mode, subject: e.subject, label: e.label, skill: e.skill, kind: e.kind, outcome: e.outcome, occurredAt: e.occurredAt};
}

export interface EventStorage {
  readonly length: number; key(index: number): string | null;
  getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void;
}

/** A separate key per attempt avoids two tabs overwriting a shared queue array. */
export class ReviewOutbox {
  private readonly pending = new Map<string, ReviewEvent>();
  warning = '';
  private readonly acknowledged = new Set<string>();
  constructor(private readonly storage: EventStorage | null, private readonly prefix: string) {}
  add(value: ReviewEvent): void {
    const event = parseEvent(value), old = this.pending.get(event.id);
    if (old && JSON.stringify(old) !== JSON.stringify(event)) throw new Error('Attempt IDs are immutable');
    this.pending.set(event.id, event);
    try {
      if (!this.storage) throw new Error('Storage unavailable');
      this.storage.setItem(this.prefix + event.id, JSON.stringify(event));
    } catch { this.warning = 'Review history is kept in this tab until it syncs. Browser backup is unavailable.'; }
  }
  batch(limit = 100): ReviewEvent[] {
    try {
      if (!this.storage) throw new Error('Storage unavailable');
      const keys: string[] = [];
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i); if (key?.startsWith(this.prefix)) keys.push(key);
      }
      for (const key of keys) {
        try {
          const event = parseEvent(JSON.parse(this.storage.getItem(key) || 'null'));
          if (key !== this.prefix + event.id) throw new Error('Mismatched key');
          if (this.acknowledged.has(event.id)) continue;
          const old = this.pending.get(event.id);
          if (old && JSON.stringify(old) !== JSON.stringify(event)) throw new Error('Changed attempt');
          this.pending.set(event.id, event);
        } catch { this.warning = 'An unreadable review-history backup was preserved. Export browser data before clearing storage.'; }
      }
    } catch { this.warning = 'Review history is kept in this tab until it syncs. Browser backup is unavailable.'; }
    return [...this.pending.values()].sort((a, b) => a.occurredAt - b.occurredAt || a.id.localeCompare(b.id)).slice(0, limit);
  }
  acknowledge(ids: readonly string[]): void {
    for (const id of ids) {
      const event = this.pending.get(id);
      if (!event) continue;
      try {
        const raw = this.storage?.getItem(this.prefix + id);
        if (raw && JSON.stringify(parseEvent(JSON.parse(raw))) === JSON.stringify(event)) this.storage?.removeItem(this.prefix + id);
      } catch { this.warning = 'A review-history backup could not be cleared. Safe retries will not duplicate saved attempts.'; }
      this.acknowledged.add(id);
      this.pending.delete(id);
    }
  }
}
