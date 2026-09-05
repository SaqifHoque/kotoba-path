export interface KanjiCard {
  character: string; meaning: string; onyomi: string; kunyomi: string;
  grade: number; strokes: number; radical: string; radicalMeaning: string; examples: string[][];
}
export interface KanjiLevel { number: number; cards: KanjiCard[]; }
export function buildLevels(cards: KanjiCard[]): KanjiLevel[] {
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
