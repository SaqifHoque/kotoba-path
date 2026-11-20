import { ForgeState } from '../forge/forge-engine';
import { cleanSynonyms, setMeaningSynonyms } from '../learn/meaning-synonyms';

export interface MemorySnapshot {
  subjectId: string;
  note: string;
  noteAt: number;
  values: string[];
  synonymsAt: number;
}
export class MemoryConflict extends Error {}
export function memorySnapshot(state: ForgeState, subjectId: string): MemorySnapshot {
  const record = state.records[subjectId], synonyms = state.meaningSynonyms?.[subjectId];
  return {subjectId,note:record?.note??'',noteAt:record?.noteAt??0,
    values:[...(synonyms?.values??[])],synonymsAt:synonyms?.updatedAt??0};
}
export function savePersonalMemory(state: ForgeState, baseline: MemorySnapshot,
    draftNote: string, draftSynonyms: string, now: number): ForgeState {
  const current = memorySnapshot(state,baseline.subjectId);
  if (current.note !== baseline.note || current.noteAt !== baseline.noteAt ||
      current.synonymsAt !== baseline.synonymsAt || JSON.stringify(current.values)!==JSON.stringify(baseline.values)) {
    throw new MemoryConflict('Saved memory aids changed. Your draft is kept; reload the saved version before editing again.');
  }
  const note = draftNote.trim();
  if (draftNote.length > 1000) throw new Error('Use at most 1,000 characters for a memory note.');
  const values = cleanSynonyms(draftSynonyms.trim()?draftSynonyms.split(/\r?\n/):[]);
  const record = state.records[baseline.subjectId];
  if (!record && note) throw new Error('Introduce this subject before saving a memory note.');
  const noteChanged = note !== current.note;
  const synonymsChanged = JSON.stringify(values)!==JSON.stringify(current.values);
  if (!noteChanged && !synonymsChanged) return state;
  let records = state.records;
  if (noteChanged && record) {
    const noteAt = Math.max(now,record.noteAt+1);
    if (!Number.isSafeInteger(noteAt) || noteAt < 0 || noteAt > 8640000000000000) throw new Error('The note timestamp cannot be advanced.');
    records = {...records,[baseline.subjectId]:{...record,note,noteAt}};
  }
  return {...state,records,meaningSynonyms:synonymsChanged
    ?setMeaningSynonyms(state.meaningSynonyms,baseline.subjectId,values,now):state.meaningSynonyms};
}
