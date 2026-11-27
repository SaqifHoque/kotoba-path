import { ForgeState, STAGES, Subject, contrasts } from '../forge/forge-engine';
import { AssociationIndex, buildAssociationIndex } from './association-index';

export interface KanjiComparisonIndex {
  associations: AssociationIndex;
  candidates: Subject[];
  peers: ReadonlyMap<string, Subject[]>;
}
const compare = (a: Subject,b: Subject) => a.id<b.id?-1:a.id>b.id?1:0;

/** Reuse the course's curated visual groups; this does not infer learner confusion. */
export function buildKanjiComparisonIndex(subjects: Subject[]): KanjiComparisonIndex {
  const associations=buildAssociationIndex(subjects), peers=new Map<string,Subject[]>();
  const kanji=subjects.filter(s=>s.kind==='kanji');
  for (const subject of kanji) {
    const matches=contrasts(subject,kanji).sort(compare);
    if (matches.length) peers.set(subject.id,matches);
  }
  return {associations,peers,candidates:kanji.filter(s=>peers.has(s.id)).sort(compare)};
}
export function kanjiComparison(index: KanjiComparisonIndex, leftId: string, rightId: string, forge: ForgeState) {
  if (!index.peers.get(leftId)?.some(s=>s.id===rightId)) return null;
  const side = (id: string) => {
    const detail=index.associations.details(id)!;
    const record=forge.records[id];
    return {subject:detail.subject,components:detail.components,radicals:detail.primaryRadicals,
      words:detail.words.slice(0,3),wordCount:detail.words.length,note:record?.note??'',
      synonyms:[...(forge.meaningSynonyms?.[id]?.values??[])],introduced:!!record,
      meaningStage:record?STAGES[record.meaning.stage]:'Not introduced',
      readingStage:record?.reading?STAGES[record.reading.stage]:'Not introduced'};
  };
  return {left:side(leftId),right:side(rightId)};
}
