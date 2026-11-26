import { ForgeState, Question, Skill, Subject, Track, skills } from '../forge/forge-engine';

export interface TroubleFilters {
  query: string;
  kind: 'all' | Subject['kind'];
  skill: 'all' | Skill;
  timing: 'all' | 'due';
}
export interface TroubleSpot extends Question {
  track: Track;
  due: boolean;
  note: string;
  synonyms: string[];
}
export const defaultTroubleFilters = (): TroubleFilters => ({query:'',kind:'all',skill:'all',timing:'all'});
const normalize = (value: string) => value.normalize('NFKC').toLowerCase()
  .replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
const compare = (a: string,b: string) => a<b?-1:a>b?1:0;

/** Lifetime scheduled counters, not recent history or a retention prediction. */
export function troubleSpots(subjects: readonly Subject[], forge: ForgeState, now: number): TroubleSpot[] {
  const seen = new Set<string>();
  return subjects.flatMap(subject => {
    if (seen.has(subject.id)) return [];
    seen.add(subject.id);
    const record = forge.records[subject.id];
    if (!record) return [];
    return skills(subject).flatMap(skill => {
      const track = record[skill];
      // Match the typed course's existing weak-item rule; Burned skills are retired.
      if (!track || track.stage>=9 || track.due===null || track.misses<3 || track.correct/Math.max(1,track.reviews)>=.8) return [];
      return [{subject,skill,track:{...track},due:track.due<=now,
        note:record.note,synonyms:[...(forge.meaningSynonyms?.[subject.id]?.values??[])]}];
    });
  }).sort((a,b)=>b.track.misses-a.track.misses || a.track.correct/a.track.reviews-b.track.correct/b.track.reviews
    || compare(a.subject.id,b.subject.id) || compare(a.skill,b.skill));
}
export function filterTroubleSpots(items: readonly TroubleSpot[], filters: TroubleFilters): TroubleSpot[] {
  const tokens = normalize(filters.query).trim().split(/\s+/).filter(Boolean);
  return items.filter(item => {
    if (filters.kind!=='all'&&item.subject.kind!==filters.kind) return false;
    if (filters.skill!=='all'&&item.skill!==filters.skill) return false;
    if (filters.timing==='due'&&!item.due) return false;
    const fields = [item.subject.text,item.subject.meaning,...item.subject.readings,...item.synonyms].map(normalize);
    return tokens.every(token=>fields.some(field=>field.includes(token)));
  });
}
/** Practice selects at most ten matched skills, independently of visible pagination. */
export function troublePracticeQuestions(items: readonly TroubleSpot[]): Question[] {
  return items.slice(0,10).map(({subject,skill})=>({subject,skill}));
}
