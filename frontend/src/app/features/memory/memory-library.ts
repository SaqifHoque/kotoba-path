import { ForgeState, Subject } from '../forge/forge-engine';

export interface MemoryFilters {
  query: string;
  kind: 'all' | Subject['kind'];
  content: 'all' | 'notes' | 'synonyms';
  sort: 'recent' | 'text';
}
export interface SavedMemory {
  id: string;
  text: string;
  kind: Subject['kind'];
  meaning: string;
  readings: string[];
  note: string;
  synonyms: string[];
  editedAt: number;
  introduced: boolean;
}
const normalize = (value: string) => value.normalize('NFKC').toLowerCase()
  .replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
const compare = (a: string,b: string) => a<b?-1:a>b?1:0;

/** Only canonical catalog subjects with actual saved content enter this read-only list. */
export function savedMemories(subjects: readonly Subject[], forge: ForgeState): SavedMemory[] {
  const seen = new Set<string>();
  return subjects.flatMap(subject => {
    if (seen.has(subject.id)) return [];
    seen.add(subject.id);
    const record = forge.records[subject.id], aliases = forge.meaningSynonyms?.[subject.id];
    const note = record?.note.trim() ?? '';
    const synonyms = [...(aliases?.values ?? [])];
    if (!note && !synonyms.length) return [];
    return [{id:subject.id,text:subject.text,kind:subject.kind,meaning:subject.meaning,
      readings:[...subject.readings],note,synonyms,
      editedAt:Math.max(record?.noteAt??0,aliases?.updatedAt??0),introduced:!!record}];
  });
}
export function memoryMatches(items: readonly SavedMemory[], filters: MemoryFilters): SavedMemory[] {
  const tokens = normalize(filters.query).trim().split(/\s+/).filter(Boolean);
  return items.filter(item => {
    if (filters.kind!=='all' && item.kind!==filters.kind) return false;
    if (filters.content==='notes'&&!item.note || filters.content==='synonyms'&&!item.synonyms.length) return false;
    const fields = [item.text,item.meaning,item.note,...item.readings,...item.synonyms].map(normalize);
    return tokens.every(token=>fields.some(field=>field.includes(token)));
  }).sort((a,b)=>(filters.sort==='recent'?b.editedAt-a.editedAt:compare(normalize(a.text),normalize(b.text)))||compare(a.id,b.id));
}
