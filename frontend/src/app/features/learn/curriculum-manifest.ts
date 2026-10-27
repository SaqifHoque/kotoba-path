import { KanjiCard, LearningComponent } from './kanji-curriculum';

/** Published identifiers are storage keys, independent of the displayed reading. */
export interface CurriculumManifest {
  schemaVersion: 1;
  curriculumVersion: string;
  kanji: { id: string; character: string; level: number; radicalId: string; components: LearningComponent[] }[];
  vocabulary: { id: string; text: string; reading: string }[];
}

const fail = (detail: string): never => { throw new Error(`Invalid curriculum: ${detail}`); };
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const id = (value: unknown, prefix: string): value is string => typeof value === 'string' && value.startsWith(prefix) && value.length > prefix.length && value.length <= 200;
const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

/** Reject a broken release before sync can filter records against an incomplete catalog. */
export function applyCurriculum(cards: KanjiCard[], input: unknown): KanjiCard[] {
  if (!object(input) || input['schemaVersion'] !== 1 || !nonempty(input['curriculumVersion']) ||
      !/^\d+\.\d+\.\d+$/.test(input['curriculumVersion']) || !Array.isArray(input['kanji']) || !Array.isArray(input['vocabulary'])) fail('unsupported manifest');
  const manifest = input as unknown as CurriculumManifest;
  const byCharacter = new Map<string, CurriculumManifest['kanji'][number]>();
  const subjectIds = new Set<string>();
  const levels = new Map<number, number>();
  for (const entry of manifest.kanji) {
    if (!object(entry) || !nonempty(entry.character) || entry.id !== `k:${entry.character}` ||
        !id(entry.radicalId, 'r:') || !Number.isInteger(entry.level) || entry.level < 1 || entry.level > 103 ||
        !Array.isArray(entry.components) || byCharacter.has(entry.character)) fail('kanji identity or level');
    byCharacter.set(entry.character, entry);
    subjectIds.add(entry.id); subjectIds.add(entry.radicalId);
    levels.set(entry.level, (levels.get(entry.level) ?? 0) + 1);
  }
  if (levels.size !== 103 || [...levels.values()].some(count => count < 10 || count > 12) ||
      cards.length !== byCharacter.size || new Set(cards.map(card => card.character)).size !== cards.length) fail('catalog coverage');
  const vocabulary = new Map<string, string>(), wordIds = new Set<string>();
  for (const word of manifest.vocabulary) {
    if (!object(word) || !id(word.id, 'v:') || !nonempty(word.text) || !nonempty(word.reading)) fail('vocabulary identity');
    const key = `${word.text}:${word.reading}`;
    if (vocabulary.has(key) || wordIds.has(word.id)) fail('duplicate vocabulary');
    vocabulary.set(key, word.id.slice(2)); wordIds.add(word.id);
  }
  const usedWords = new Set<string>();
  const result = cards.map(card => {
    const entry = byCharacter.get(card.character);
    if (!entry || entry.radicalId !== `r:${card.radical.normalize('NFKC')}`) return fail('missing kanji or changed primary radical');
    const words: Record<string, string> = {};
    for (const [label] of card.examples) {
      const match = /^(.+?)（(.+)）$/.exec(label);
      if (!match) continue;
      const key = `${match[1]}:${match[2]}`, stableId = vocabulary.get(key);
      if (!stableId) return fail(`unregistered vocabulary ${key}`);
      words[key] = stableId; usedWords.add(key);
    }
    return {...card, curriculum: {id: entry.id, level: entry.level, radicalId: entry.radicalId,
      vocabulary: words, components: entry.components.map(component => ({...component}))}};
  });
  if (usedWords.size !== vocabulary.size) fail('unused vocabulary identity');
  const visiting = new Set<string>(), visited = new Set<string>();
  const components = new Map(manifest.kanji.map(entry => [entry.id, entry.components]));
  const visit = (subject: string): void => {
    if (visiting.has(subject)) fail('component cycle');
    if (visited.has(subject)) return;
    visiting.add(subject);
    const seen = new Set<string>();
    for (const component of components.get(subject) ?? []) {
      if (!object(component) || !nonempty(component.form) || !subjectIds.has(component.subjectId) || seen.has(component.subjectId)) fail('component reference');
      seen.add(component.subjectId); visit(component.subjectId);
    }
    visiting.delete(subject); visited.add(subject);
  };
  for (const subject of components.keys()) visit(subject);
  return result;
}
