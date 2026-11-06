import { KanjiCard } from '../learn/kanji-curriculum';
import { buildVocabulary } from '../learn/practice-engine';

export interface ChapterShape {
  id: string;
  subjectId: string;
  form: string;
  name: string;
  memory: string;
}
export interface ChapterKanji {
  subjectId: string;
  meaning: string;
  memory: string;
  reading: string;
  readingNote: string;
  shapeIds: string[];
}
export interface ChapterWord {
  id: string;
  text: string;
  reading: string;
  meaning: string;
  kanjiIds: string[];
  readingNote: string;
  sentence: {text: string; reading: string; meaning: string; note: string};
}
export interface ChapterRecall {
  id: string;
  prompt: string;
  answer: string;
  explanation: string;
  subjectIds: string[];
}
export interface StudyChapter {
  schemaVersion: 1;
  id: string;
  version: string;
  title: string;
  description: string;
  goals: string[];
  shapes: ChapterShape[];
  kanji: ChapterKanji[];
  words: ChapterWord[];
  recall: ChapterRecall[];
}

/** Content validation is read-only: a chapter cannot introduce or advance SRS records. */
export function validateChapter(chapter: StudyChapter, cards: KanjiCard[]): void {
  const require = (valid: boolean, detail: string): void => {
    if (!valid) throw new Error(`Invalid chapter: ${detail}`);
  };
  const text = (value: string): boolean => typeof value === 'string' && !!value.trim();
  const texts = (values: string[]): boolean => values.length > 0 && values.every(text);
  require(chapter.schemaVersion === 1 && /^chapter:[a-z0-9-]+$/.test(chapter.id) && /^\d+\.\d+\.\d+$/.test(chapter.version), 'version or identity');
  require(text(chapter.title) && text(chapter.description) && texts(chapter.goals), 'chapter introduction');
  require(chapter.shapes.length > 0 && chapter.kanji.length > 0 && chapter.words.length > 0 && chapter.recall.length > 0, 'empty section');
  const catalog = new Map(cards.map(card => [card.curriculum?.id ?? `k:${card.character}`, card]));
  const shapes = new Map(chapter.shapes.map(shape => [shape.id, shape]));
  const kanji = new Set(chapter.kanji.map(item => item.subjectId));
  const words = new Set(chapter.words.map(word => word.id));
  require(shapes.size === chapter.shapes.length && kanji.size === chapter.kanji.length && words.size === chapter.words.length, 'duplicate identity');
  const unique = (ids: string[]): boolean => ids.length === new Set(ids).size;
  for (const shape of chapter.shapes) {
    require(/^shape:[a-z0-9-]+$/.test(shape.id) && catalog.has(shape.subjectId), 'shape subject');
    require(text(shape.form) && text(shape.name) && text(shape.memory), 'shape content');
  }
  const publishedWords = buildVocabulary(cards);
  const byWordId = new Map(publishedWords.map(word => [`v:${word.id}`, word]));
  const byWordText = new Map(publishedWords.map(word => [`${word.text}:${word.reading}`, `v:${word.id}`]));
  const introduced = new Set<string>();
  for (const item of chapter.kanji) {
    require(catalog.has(item.subjectId) && text(item.meaning) && text(item.memory) && text(item.reading) && text(item.readingNote), 'kanji content');
    require(texts(item.shapeIds) && unique(item.shapeIds) && item.shapeIds.every(id => shapes.has(id)), 'kanji shapes');
    for (const id of item.shapeIds) {
      const subject = shapes.get(id)!.subjectId;
      require(subject === item.subjectId || introduced.has(subject), 'component must be taught before compound kanji');
    }
    const links = item.shapeIds.map(id => shapes.get(id)!);
    for (const component of catalog.get(item.subjectId)!.curriculum?.components ?? []) {
      require(links.some(shape => shape.subjectId === component.subjectId && shape.form === component.form), 'published component mismatch');
    }
    introduced.add(item.subjectId);
  }
  require(chapter.shapes.every(shape => chapter.kanji.some(item => item.shapeIds.includes(shape.id))), 'unused shape');
  for (const word of chapter.words) {
    require(/^v:.+$/u.test(word.id) && word.id.length <= 200 && text(word.text) && text(word.reading) && text(word.meaning) && text(word.readingNote), 'word content');
    require(texts(word.kanjiIds) && unique(word.kanjiIds) && word.kanjiIds.every(id => kanji.has(id)), 'word prerequisite');
    const characters = [...new Set(word.text.match(/\p{Script=Han}/gu) ?? [])];
    require(characters.length === word.kanjiIds.length && characters.every(character => word.kanjiIds.includes(`k:${character}`)), 'word kanji coverage');
    const published = byWordId.get(word.id);
    require(!published || (published.text === word.text && published.reading === word.reading), 'published word identity collision');
    const publishedId = byWordText.get(`${word.text}:${word.reading}`);
    require(!publishedId || publishedId === word.id, 'published word identity must be reused');
    require(/^[\p{Script=Hiragana}\p{Script=Katakana}ー]+$/u.test(word.reading), 'word kana reading');
    const sentence = word.sentence;
    require(text(sentence.text) && text(sentence.reading) && text(sentence.meaning) && text(sentence.note), 'sentence content');
    require(!/\p{Script=Han}/u.test(sentence.reading), 'sentence kana guide');
    require(word.kanjiIds.every(id => sentence.text.includes(id.slice(2))), 'sentence must practise its word kanji');
    require((sentence.text.match(/\p{Script=Han}/gu) ?? []).every(character => kanji.has(`k:${character}`)), 'sentence contains untaught kanji');
  }
  require(unique(chapter.words.map(word => `${word.text}:${word.reading}`)), 'duplicate word');
  require(unique(chapter.recall.map(item => item.id)), 'duplicate recall identity');
  const covered = new Set<string>();
  for (const item of chapter.recall) {
    require(/^recall:[a-z0-9-]+$/.test(item.id) && text(item.prompt) && text(item.answer) && text(item.explanation), 'recall content');
    require(texts(item.subjectIds) && unique(item.subjectIds) && item.subjectIds.every(id => kanji.has(id) || words.has(id)), 'recall subject');
    item.subjectIds.forEach(id => covered.add(id));
  }
  require([...kanji, ...words].every(id => covered.has(id)), 'every subject needs a recall prompt');
}
