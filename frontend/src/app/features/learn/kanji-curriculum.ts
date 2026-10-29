export interface LearningComponent { subjectId: string; form: string; }
export interface CardIdentity {
  id: string; level: number; radicalId: string;
  vocabulary: Record<string, string>;
  components: LearningComponent[];
}
export interface KanjiCard {
  curriculum?: CardIdentity;
  radicalImage?: string;
  character: string; meaning: string; onyomi: string; kunyomi: string;
  grade: number; strokes: number; radical: string; radicalMeaning: string; examples: string[][];
}
export interface KanjiLevel { number: number; cards: KanjiCard[]; }
export function buildLevels(cards: KanjiCard[]): KanjiLevel[] {
  if (cards.some(card => card.curriculum)) {
    if (cards.some(card => !card.curriculum) || new Set(cards.map(card => card.character)).size !== cards.length) {
      throw new Error('Mixed or duplicate curriculum identities.');
    }
    const levels = Array.from({length: 103}, (_, i) => ({number: i + 1, cards: [] as KanjiCard[]}));
    for (const card of cards) {
      const level = card.curriculum!.level;
      if (!Number.isInteger(level) || level < 1 || level > 103) throw new Error('Invalid published level.');
      levels[level - 1].cards.push(card);
    }
    if (levels.some(level => level.cards.length < 10 || level.cards.length > 12)) throw new Error('Incomplete published levels.');
    for (const level of levels) level.cards.sort((a, b) => a.grade - b.grade || a.strokes - b.strokes || a.character.codePointAt(0)! - b.character.codePointAt(0)!);
    return levels;
  }
  const count = Math.ceil(cards.length / 12);
  const size = Math.floor(cards.length / count), extra = cards.length % count;
  if (count < 100 || size < 10 || new Set(cards.map(c => c.character)).size !== cards.length) {
    throw new Error('The curriculum needs at least 100 levels of 10–12 unique kanji.');
  }
  let offset = 0;
  return Array.from({length: count}, (_, i) => {
    const length = size + (i < extra ? 1 : 0);
    const level = {number: i + 1, cards: cards.slice(offset, offset + length)};
    offset += length;
    return level;
  });
}
