import { normalizeMeaning } from './answer-checker';

export interface MeaningSynonymEntry { values: string[]; updatedAt: number; }
export type MeaningSynonyms = Record<string, MeaningSynonymEntry>;
const MAX_TIME = 8640000000000000;
export function cleanSynonyms(values: readonly string[]): string[] {
  if (values.length > 8) throw new Error('Use at most eight synonyms per item.');
  const seen = new Set<string>(), result: string[] = [];
  for (const raw of values) {
    if (typeof raw !== 'string' || !raw.trim() || raw.length > 80 || /[\u0000-\u001f\u007f-\u009f]/u.test(raw)) throw new Error('Each synonym must contain 1–80 characters on one line.');
    const value = raw.trim(), normalized = normalizeMeaning(value);
    if (!normalized || !/[\p{Script=Latin}\p{N}]/u.test(normalized) || /[^\p{Script=Latin}\p{M}\p{N}' ]/u.test(normalized)) throw new Error('Use English words or numbers for meaning synonyms, not Japanese readings.');
    if (!seen.has(normalized)) { result.push(value); seen.add(normalized); }
  }
  return result.sort((a, b) => a < b ? -1 : a > b ? 1 : 0);
}
export function parseMeaningSynonyms(value: unknown, subjectIds: ReadonlySet<string>): MeaningSynonyms {
  if (value === undefined) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length > 6000) throw new Error('Invalid meaning synonyms');
  const result: MeaningSynonyms = {};
  for (const [id, entry] of Object.entries(value as MeaningSynonyms)) {
    if (!/^[rkv]:.{1,198}$/u.test(id) || !entry || !Array.isArray(entry.values) || !Number.isSafeInteger(entry.updatedAt) || entry.updatedAt < 0 || entry.updatedAt > MAX_TIME) throw new Error('Invalid meaning synonyms');
    const values = cleanSynonyms(entry.values);
    if (subjectIds.has(id)) result[id] = {values, updatedAt: entry.updatedAt};
  }
  return result;
}
export function mergeMeaningSynonyms(a: MeaningSynonyms = {}, b: MeaningSynonyms = {}): MeaningSynonyms {
  const result = {...a};
  for (const [id, value] of Object.entries(b)) {
    const old = result[id];
    if (!old || value.updatedAt > old.updatedAt || (value.updatedAt === old.updatedAt &&
      ((!value.values.length && !!old.values.length) || (!!value.values.length === !!old.values.length && value.values.join('\0') > old.values.join('\0'))))) result[id] = value;
  }
  return result;
}
export function setMeaningSynonyms(previous: MeaningSynonyms | undefined, subject: string, values: readonly string[], now: number): MeaningSynonyms {
  const updatedAt = Math.max(now, (previous?.[subject]?.updatedAt ?? -1) + 1);
  if (!Number.isSafeInteger(updatedAt) || updatedAt < 0 || updatedAt > MAX_TIME) throw new Error('Invalid synonym timestamp');
  return {...previous, [subject]: {values: cleanSynonyms(values), updatedAt}};
}
