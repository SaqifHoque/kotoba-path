import { KanjiCard, ReviewProgress, parseProgress } from '../learn/kanji-engine';
import { Proficiency, BANDS } from '../learn/proficiency';
import { buildVocabulary } from '../learn/practice-engine';
import { mergeReviews } from '../learn/study-progress';
import { ForgeState, Subject, emptyForge, mergeForge, parseForge } from '../forge/forge-engine';

export interface ProgressSnapshot { profile: Proficiency | null; kanji: ReviewProgress; vocabulary: ReviewProgress; forge: ForgeState; }
export type LegacyKind = 'kanji' | 'vocabulary';
export interface ProgressImport { kind: 'all' | 'forge' | LegacyKind; progress: Partial<ProgressSnapshot>; skipped: number; }
export interface ImportRow { label: string; added: number; updated: number; unchanged: number; }
export interface ImportSummary { rows: ImportRow[]; profileChanged: boolean; forgeSettingsChanged: boolean; }
const MAX_TIME = 8640000000000000;
const MAX_COUNT = 2147483647;
const object = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);
const time = (v: unknown): boolean => Number.isSafeInteger(v) && (v as number) >= 0 && (v as number) <= MAX_TIME;
const requireValid = (valid: boolean): void => { if (!valid) throw new Error('This progress file contains invalid data. Your progress has not changed.'); };

function profile(value: unknown): Proficiency | null {
  if (value === null) return null;
  requireValid(object(value));
  const p = value as Proficiency;
  requireValid([...BANDS,'unsure'].includes(p.level) && ['studying','comfortable'].includes(p.familiarity) && time(p.updatedAt));
  const result: Proficiency = {level:p.level,familiarity:p.familiarity,updatedAt:p.updatedAt};
  if (p.placement !== undefined) {
    const q = p.placement;
    requireValid(object(q) && q.total === 5 && Number.isInteger(q.correct) && q.correct >= 0 && q.correct <= 5 && BANDS.includes(q.suggested));
    result.placement = {correct:q.correct,total:5,suggested:q.suggested};
  }
  return result;
}
function reviews(value: unknown, ids: string[], limit: number, skipped: {count: number}): ReviewProgress {
  requireValid(object(value) && Object.keys(value).length <= limit);
  const raw = value as ReviewProgress;
  // Validate unknown entries too, then omit subjects absent from this catalog.
  const parsed = parseProgress(JSON.stringify({version:1,cards:raw}),Object.keys(raw).map(character=>({character})));
  for (const p of Object.values(parsed)) requireValid(time(p.due) && Number.isSafeInteger(p.attempts) && p.attempts <= MAX_COUNT);
  const known = new Set(ids);
  skipped.count += Object.keys(parsed).filter(id=>!known.has(id)).length;
  return Object.fromEntries(Object.entries(parsed).filter(([id])=>known.has(id)));
}
function forge(value: unknown, subjects: Subject[], skipped: {count: number}): ForgeState {
  requireValid(object(value));
  const f = value as ForgeState;
  requireValid(object(f.records) && Object.keys(f.records).length <= 6000 && time(f.settingsAt));
  for (const record of Object.values(f.records)) requireValid(object(record));
  const allSubjects = Object.keys(f.records).map(id => {
    requireValid(/^[rkv]:.{1,198}$/u.test(id));
    return {id,kind:id[0]==='r'?'radical':id[0]==='k'?'kanji':'vocabulary',readings:id[0]==='r'?[]:['reading'],text:id,meaning:'',prerequisites:[],level:1,hint:''} as Subject;
  });
  const validated = parseForge(value,allSubjects);
  for (const [id,r] of Object.entries(validated.records)) {
    requireValid(time(r.lessonAt) && time(r.noteAt));
    for (const t of [r.meaning,r.reading].filter(t=>!!t)) {
      requireValid(time(t!.updatedAt) && (t!.due===null||time(t!.due)) && t!.reviews <= MAX_COUNT && t!.correct <= MAX_COUNT && t!.misses <= MAX_COUNT);
    }
  }
  const known = new Set(subjects.map(s=>s.id));
  skipped.count += Object.keys(f.records).filter(id=>!known.has(id)).length;
  skipped.count += Object.keys(f.meaningSynonyms ?? {}).filter(id=>!known.has(id)).length;
  // Reparse against the actual subjects so reading requirements and synonyms match the catalog.
  const parsed = parseForge(value,subjects);
  const track = (t: ForgeState['records'][string]['meaning']) => ({stage:t.stage,due:t.due,reviews:t.reviews,correct:t.correct,misses:t.misses,updatedAt:t.updatedAt});
  const records = Object.fromEntries(Object.entries(parsed.records).map(([id,r])=>[id,{lessonAt:r.lessonAt,note:r.note,noteAt:r.noteAt,
    meaning:track(r.meaning),...(r.reading?{reading:track(r.reading)}:{})}]));
  return {version:1,records,unlockedLevel:parsed.unlockedLevel,dailyLimit:parsed.dailyLimit,settingsAt:parsed.settingsAt,meaningSynonyms:parsed.meaningSynonyms};
}

export function parseBackup(text: string, cards: KanjiCard[], subjects: Subject[], legacy?: LegacyKind): ProgressImport {
  if (new Blob([text]).size > 32000000) throw new Error('Choose a progress file smaller than 32 MB.');
  const value: unknown = JSON.parse(text);
  requireValid(object(value));
  const v = value as Record<string, any>, skipped = {count:0};
  const kanjiIds = cards.map(c=>c.character), wordIds = buildVocabulary(cards).map(w=>w.id);
  let kind: ProgressImport['kind'], progress: Partial<ProgressSnapshot>;
  if (v['format'] === 'kotoba-path-progress') {
    requireValid(v['version'] === 1 && time(v['exportedAt']) && object(v['progress']));
    const p = v['progress'];
    kind = 'all';
    progress = {profile:profile(p.profile),kanji:reviews(p.kanji,kanjiIds,2000,skipped),vocabulary:reviews(p.vocabulary,wordIds,6000,skipped),forge:forge(p.forge,subjects,skipped)};
  } else if (v['format'] === undefined && v['version'] === 1 && v['records'] !== undefined) {
    kind = 'forge'; progress = {forge:forge(v,subjects,skipped)};
  } else if (v['format'] === undefined && v['version'] === 1 && object(v['cards'])) {
    if (!legacy) throw new Error('Choose whether this older file contains kanji or vocabulary progress, then preview it.');
    kind = legacy;
    progress = {[legacy]:reviews(v['cards'],legacy==='kanji'?kanjiIds:wordIds,legacy==='kanji'?2000:6000,skipped)};
    if (Object.keys(v['cards']).length && !Object.keys(progress[legacy]!).length) throw new Error('No matching items were found. Check the older file type and try again.');
  } else throw new Error('This is not a supported Kotoba Path progress file.');
  return {kind,progress,skipped:skipped.count};
}
export function mergeBackup(current: ProgressSnapshot, incoming: ProgressImport): ProgressSnapshot {
  const p = incoming.progress;
  return {profile:!current.profile || (p.profile && p.profile.updatedAt > current.profile.updatedAt) ? p.profile ?? current.profile : current.profile,
    kanji:mergeReviews(current.kanji,p.kanji ?? {}),vocabulary:mergeReviews(current.vocabulary,p.vocabulary ?? {}),forge:mergeForge(current.forge,p.forge ?? emptyForge())};
}
export function summarizeImport(current: ProgressSnapshot, incoming: ProgressImport): ImportSummary {
  const merged = mergeBackup(current,incoming);
  const row = (label:string, before:Record<string,unknown>, after:Record<string,unknown>, included:Record<string,unknown>): ImportRow => {
    const result = {label,added:0,updated:0,unchanged:0};
    for (const id of Object.keys(included)) {
      if (!Object.hasOwn(before,id)) result.added++;
      else if (JSON.stringify(before[id]) !== JSON.stringify(after[id])) result.updated++;
      else result.unchanged++;
    }
    return result;
  };
  return {rows:[row('Kanji',current.kanji,merged.kanji,incoming.progress.kanji ?? {}),row('Vocabulary',current.vocabulary,merged.vocabulary,incoming.progress.vocabulary ?? {}),
    row('Forge subjects',current.forge.records,merged.forge.records,incoming.progress.forge?.records ?? {}),
    row('Personal meaning preferences',current.forge.meaningSynonyms ?? {},merged.forge.meaningSynonyms ?? {},incoming.progress.forge?.meaningSynonyms ?? {})],
    profileChanged:JSON.stringify(current.profile)!==JSON.stringify(merged.profile),
    forgeSettingsChanged:current.forge.unlockedLevel!==merged.forge.unlockedLevel||current.forge.dailyLimit!==merged.forge.dailyLimit||current.forge.settingsAt!==merged.forge.settingsAt};
}
export function createBackup(progress: ProgressSnapshot, now: number) {
  // Explicit fields exclude server revisions, credentials, and review-event queues.
  return {format:'kotoba-path-progress',version:1,exportedAt:now,progress:{profile:progress.profile,kanji:progress.kanji,vocabulary:progress.vocabulary,forge:progress.forge}};
}
export function progressFingerprint(progress: ProgressSnapshot): string { return JSON.stringify(createBackup(progress,0).progress); }
