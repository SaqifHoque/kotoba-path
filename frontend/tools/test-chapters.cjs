const assert = require('node:assert/strict');
const path = require('node:path');
const root = process.argv[2];
const {validateChapter} = require(path.join(root, 'chapters/chapter.js'));
const {STARTER_CHAPTER: chapter} = require(path.join(root, 'chapters/starter-chapter.js'));
const {applyCurriculum} = require(path.join(root, 'learn/curriculum-manifest.js'));
const {buildForge, emptyForge, canLearn} = require(path.join(root, 'forge/forge-engine.js'));
const {buildVocabulary} = require(path.join(root, 'learn/practice-engine.js'));
const source = require('../src/assets/kanji-curriculum.json');
const manifest = require('../src/assets/curriculum-manifest.json');
const cards = applyCurriculum(source, manifest);
const clone = value => JSON.parse(JSON.stringify(value));
const before = JSON.stringify({cards, chapter});
const subjects = buildForge(cards), words = buildVocabulary(cards);
const state = emptyForge();
const eligibility = subjects.filter(subject => canLearn(subject, state)).map(subject => subject.id);
validateChapter(chapter, cards);
assert.equal(JSON.stringify({cards, chapter}), before, 'chapter validation must not mutate the catalog or content');
assert.deepEqual(buildForge(cards), subjects);
assert.deepEqual(buildVocabulary(cards), words, 'browsing must not enroll chapter-only words into existing queues');
assert.deepEqual(subjects.filter(subject => canLearn(subject, state)).map(subject => subject.id), eligibility);
assert.equal(chapter.shapes.length, 5);
assert.deepEqual(chapter.kanji.map(item => item.subjectId), ['k:人', 'k:木', 'k:休', 'k:日', 'k:月']);
assert.equal(chapter.words.length, 6);
assert.equal(chapter.recall.length, 11);
assert.deepEqual(chapter.words.map(word => [word.text, word.reading]), [
  ['人','ひと'], ['木','き'], ['休む','やすむ'], ['日','ひ'], ['月','つき'], ['休日','きゅうじつ']
]);
const holiday = chapter.words.find(word => word.text === '休日');
assert.equal(holiday.id, `v:${words.find(word => word.text === '休日').id}`, 'reuse the published identity of an existing word');
assert.deepEqual(holiday.kanjiIds, ['k:休','k:日']);
assert(chapter.words.every(word => word.sentence.reading && word.sentence.note && word.readingNote));
assert(chapter.recall.some(item => item.subjectIds.includes('k:休') && item.answer.includes('休')));
assert(chapter.words.find(word => word.text === '休む').sentence.text.includes('休みます'), 'include a supported polite verb form, not a misleading dictionary-form substitution');
for (const mutate of [
  c => c.schemaVersion = 2, c => c.id = 'bad', c => c.version = 'latest', c => c.title = '',
  c => c.goals = [], c => c.shapes = [], c => c.recall = [],
  c => c.shapes.push(clone(c.shapes[0])), c => c.kanji.push(clone(c.kanji[0])), c => c.words.push(clone(c.words[0])),
  c => c.shapes[0].subjectId = 'k:unknown', c => c.kanji[0].subjectId = 'k:unknown',
  c => c.shapes[0].memory = '', c => c.kanji[0].readingNote = '',
  c => c.kanji[0].shapeIds = ['shape:unknown'], c => c.kanji[0].shapeIds.push(c.kanji[0].shapeIds[0]),
  c => { [c.kanji[0], c.kanji[2]] = [c.kanji[2], c.kanji[0]]; },
  c => c.kanji[2].shapeIds = ['shape:person','shape:tree'],
  c => c.words[0].kanjiIds = ['k:月'], c => c.words[0].kanjiIds = ['k:unknown'],
  c => c.words[0].reading = '人', c => c.words[0].readingNote = '',
  c => c.words[0].id = holiday.id,
  c => c.words[c.words.length - 1].id = 'v:new-holiday',
  c => c.words[0].sentence.reading = 'あの人', c => c.words[0].sentence.note = '',
  c => c.words[0].sentence.text = '山があります。', c => c.words[0].sentence.text = '月がみえます。',
  c => c.recall[0].subjectIds = ['k:unknown'], c => c.recall[0].answer = '',
  c => c.recall[0].explanation = '', c => c.recall.push(clone(c.recall[0])), c => c.recall.pop()
]) {
  const broken = clone(chapter); mutate(broken);
  assert.throws(() => validateChapter(broken, cards), /Invalid chapter/, 'reject broken teaching content');
}
assert.throws(() => validateChapter(chapter, cards.filter(card => card.character !== '木')), /Invalid chapter/);
console.log('PASS: five-kanji/six-word starter content; component teaching order; published identities; whole-word readings; supported sentences; recall coverage; invalid content; unchanged catalog and lesson eligibility.');
