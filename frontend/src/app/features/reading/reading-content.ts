import { STARTER_CHAPTER } from '../chapters/starter-chapter';

export interface ReadingQuestion {
  prompt: string;
  choices: string[];
  correct: number;
  explanation: string;
}
export interface ReadingCard {
  id: string;
  wordId?: string;
  title: string;
  text: string;
  kana: string;
  meaning: string;
  note: string;
  target?: {text: string; reading: string};
  questions: ReadingQuestion[];
}
export function validateReading(cards: readonly ReadingCard[]): void {
  const ids = new Set<string>();
  const known = new Set(STARTER_CHAPTER.kanji.map(k => k.subjectId.slice(2)));
  for (const card of cards) {
    if (!card.id || ids.has(card.id)) throw new Error('Duplicate or empty reading identity');
    ids.add(card.id);
    if (![card.title, card.text, card.kana, card.meaning, card.note].every(s => s.trim())) throw new Error('Missing reading content');
    if ([...card.text].some(c => /\p{Script=Han}/u.test(c) && !known.has(c)) || /\p{Script=Han}/u.test(card.kana)) throw new Error('Untaught kanji or invalid guide');
    if (card.wordId) {
      const source = STARTER_CHAPTER.words.find(w => w.id === card.wordId);
      if (!source || source.sentence.text !== card.text || source.sentence.reading !== card.kana ||
          source.sentence.meaning !== card.meaning || source.sentence.note !== card.note) throw new Error('Sentence differs from chapter');
      if (!card.target || !card.target.text || card.text.split(card.target.text).length !== 2 ||
          [...source.text].some(c => /\p{Script=Han}/u.test(c) && !card.target!.text.includes(c)) ||
          !card.kana.includes(card.target.reading) ||
          !/^[ぁ-ゖー]+$/u.test(card.target.reading)) throw new Error('Invalid sentence target');
    } else if (card.target) throw new Error('A target needs a canonical word');
    if (!card.questions.length) throw new Error('Missing comprehension checks');
    for (const q of card.questions) {
      if (!q.prompt.trim() || !q.explanation.trim() || q.choices.length < 2 || q.choices.length > 4 ||
          q.choices.some(c => !c.trim()) || new Set(q.choices).size !== q.choices.length ||
          !Number.isInteger(q.correct) || q.correct < 0 || q.correct >= q.choices.length) throw new Error('Invalid comprehension check');
    }
  }
  if (!cards.length) throw new Error('No reading content');
}
