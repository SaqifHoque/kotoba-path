import { ReviewEvent } from '../learn/review-history';
import { ForgeState } from '../forge/forge-engine';
import { ChapterProgress } from '../chapters/chapter-progress';

export interface ActivityWindow { from: number; to: number; day: string; }
export interface ReviewActivity {
  from: number; to: number; recalls: number; meaning: boolean; reading: boolean;
  includedPendingIds: string[];
}
export function activityWindow(now: number): ActivityWindow {
  const date = new Date(now);
  const start = new Date(date.getFullYear(),date.getMonth(),date.getDate());
  const end = new Date(date.getFullYear(),date.getMonth(),date.getDate()+1);
  return {from:start.getTime(),to:Math.min(end.getTime(),now+1),
    day:[date.getFullYear(),date.getMonth()+1,date.getDate()].join('-')};
}
export function eligibleEvents(events: readonly ReviewEvent[], window: ActivityWindow): ReviewEvent[] {
  const seen = new Set<string>();
  return events.filter(e => {
    if (e.kind !== 'scheduled' || e.occurredAt < window.from || e.occurredAt >= window.to || seen.has(e.id)) return false;
    seen.add(e.id); return true;
  });
}
/** At most seven receipts cover the capped five-recall and two-skill goals. */
export function pendingCandidates(events: readonly ReviewEvent[], window: ActivityWindow): ReviewEvent[] {
  const eligible = eligibleEvents(events,window);
  const selected = [...eligible.slice(0,5),
    eligible.find(e=>e.skill==='meaning'||e.skill==='both'),
    eligible.find(e=>e.skill==='reading'||e.skill==='both')].filter((e): e is ReviewEvent=>!!e);
  return [...new Map(selected.map(e=>[e.id,e])).values()];
}
export function parseActivity(value: unknown, window: ActivityWindow): ReviewActivity {
  const a = value as ReviewActivity;
  if (!a || a.from !== window.from || a.to !== window.to || !Number.isInteger(a.recalls) || a.recalls < 0 || a.recalls > 5 ||
      typeof a.meaning !== 'boolean' || typeof a.reading !== 'boolean' || !Array.isArray(a.includedPendingIds) ||
      a.includedPendingIds.length > 10 || a.includedPendingIds.some(id=>typeof id!=='string')) throw new Error('Invalid activity response');
  return a;
}
export function questProgress(window: ActivityWindow, pending: readonly ReviewEvent[], activity?: ReviewActivity) {
  const acknowledged = new Set(activity?.includedPendingIds ?? []);
  const local = eligibleEvents(pending,window).filter(e=>!acknowledged.has(e.id));
  const recalls = Math.min(5,(activity?.recalls ?? 0)+local.length);
  const meaning = !!activity?.meaning || local.some(e=>e.skill==='meaning'||e.skill==='both');
  const reading = !!activity?.reading || local.some(e=>e.skill==='reading'||e.skill==='both');
  const skills = Number(meaning)+Number(reading);
  return {recalls,skills,petals:(recalls===5?2:0)+(skills===2?1:0),complete:recalls===5&&skills===2};
}
export function studyBadges(forge: ForgeState, chapter: ChapterProgress | null) {
  const words = Object.entries(forge.records).some(([id,r])=>id.startsWith('v:')&&r.meaning.stage>=1&&(r.reading?.stage??0)>=1);
  return [
    {name:'First words',detail:'Introduce a whole word in typed study.',earned:words},
    {name:'Chapter connections',detail:'Introduce all eleven starter kanji and words.',earned:!!chapter?.introductionsComplete},
    {name:'Strong foundations',detail:'Keep both skills at Guru or above for the starter chapter.',earned:!!chapter?.retentionReached}
  ];
}
