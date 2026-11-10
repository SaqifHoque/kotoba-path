import { Subject } from '../forge/forge-engine';

export interface ComponentLink { subject: Subject; form: string; }
export interface AssociationDetails {
  subject: Subject;
  primaryRadicals: Subject[];
  components: ComponentLink[];
  usedInKanji: Subject[];
  classifiedKanji: Subject[];
  kanji: Subject[];
  words: Subject[];
}
export interface AssociationIndex {
  subjects: ReadonlyMap<string, Subject>;
  details(id: string): AssociationDetails | null;
}

/** Teaching components, dictionary classification and word membership stay separate. */
export function buildAssociationIndex(subjects: Subject[]): AssociationIndex {
  const byId = new Map<string, Subject>();
  for (const subject of subjects) {
    if (byId.has(subject.id)) throw new Error(`Duplicate association subject: ${subject.id}`);
    byId.set(subject.id, subject);
  }
  const usedIn = new Map<string, Subject[]>();
  const classified = new Map<string, Subject[]>();
  const words = new Map<string, Subject[]>();
  const append = (map: Map<string, Subject[]>, id: string, subject: Subject): void => {
    if (!map.has(id)) map.set(id, []);
    const list = map.get(id)!;
    if (!list.some(item => item.id === subject.id)) list.push(subject);
  };
  for (const subject of subjects) {
    if (subject.kind === 'kanji') {
      for (const id of subject.prerequisites) {
        if (byId.get(id)?.kind === 'radical') append(classified, id, subject);
      }
      for (const component of subject.components ?? []) {
        if (!byId.has(component.subjectId)) throw new Error(`Missing component: ${component.subjectId}`);
        append(usedIn, component.subjectId, subject);
      }
    }
    if (subject.kind === 'vocabulary') {
      for (const id of subject.prerequisites) {
        if (byId.get(id)?.kind !== 'kanji') throw new Error(`Missing word kanji: ${id}`);
        append(words, id, subject);
      }
    }
  }
  const lookup = (ids: string[], kind: Subject['kind']): Subject[] => ids.map(id => byId.get(id)).filter((subject): subject is Subject => subject?.kind === kind);
  return {
    subjects: byId,
    details(id) {
      const subject = byId.get(id);
      if (!subject) return null;
      return {
        subject,
        primaryRadicals: subject.kind === 'kanji' ? lookup(subject.prerequisites, 'radical') : [],
        components: subject.kind === 'kanji' ? (subject.components ?? []).map(component => ({subject: byId.get(component.subjectId)!, form: component.form})) : [],
        usedInKanji: [...(usedIn.get(id) ?? [])],
        classifiedKanji: [...(classified.get(id) ?? [])],
        kanji: subject.kind === 'vocabulary' ? lookup(subject.prerequisites, 'kanji') : [],
        words: [...(words.get(id) ?? [])]
      };
    }
  };
}
