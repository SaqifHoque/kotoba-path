const assert = require('node:assert/strict');
const path = require('node:path');
const root = process.argv[2];
const {applyCurriculum} = require(path.join(root, 'learn/curriculum-manifest.js'));
const {buildLevels, parseProgress} = require(path.join(root, 'learn/kanji-engine.js'));
const {buildVocabulary} = require(path.join(root, 'learn/practice-engine.js'));
const {buildForge, emptyForge, parseForge, canLearn} = require(path.join(root, 'forge/forge-engine.js'));
const {createBackup, parseBackup} = require(path.join(root, 'settings/progress-backup.js'));
const source = require('../src/assets/kanji-curriculum.json');
const manifest = require('../src/assets/curriculum-manifest.json');
const clone = value => JSON.parse(JSON.stringify(value));
const original = JSON.stringify({source, manifest});
const cards = applyCurriculum(source, manifest);
assert.equal(JSON.stringify({source, manifest}), original, 'validation must not mutate assets');
const legacy = buildForge(source), subjects = buildForge(cards);
const withoutComponents = list => list.map(({components, ...subject}) => subject);
assert.deepEqual(withoutComponents(subjects), withoutComponents(legacy), 'all IDs, readings, levels, primary radicals and prerequisites stay compatible');
assert.deepEqual(buildVocabulary(cards), buildVocabulary(source));
assert.deepEqual(buildLevels(cards).map(l => l.cards.map(c => c.character)), buildLevels(source).map(l => l.cards.map(c => c.character)));
const reversed = applyCurriculum([...source].reverse(), manifest);
assert.deepEqual(buildLevels(reversed).map(l => l.cards.map(c => c.character)), buildLevels(cards).map(l => l.cards.map(c => c.character)), 'asset order cannot renumber published levels');
assert.deepEqual(withoutComponents(buildForge(reversed)), withoutComponents(subjects), 'asset order cannot change subject identity, radical level or vocabulary meaning');

// Exercise every published storage key, both tracks, notes and synonym tombstones.
const track = () => ({stage: 4, due: 5000, reviews: 8, correct: 6, misses: 2, updatedAt: 1000});
const state = emptyForge();
state.unlockedLevel = 42; state.dailyLimit = 20; state.settingsAt = 1000;
for (const subject of legacy) state.records[subject.id] = {meaning: track(), ...(subject.readings.length ? {reading: track()} : {}), lessonAt: 100, note: `Remember ${subject.text}`, noteAt: 200};
state.meaningSynonyms[legacy[0].id] = {values: [], updatedAt: 300};
assert.deepEqual(parseForge(state, subjects), state);
const progress = Object.fromEntries(source.map(c => [c.character, {learned: true, stage: 3, due: 5000, attempts: 9}]));
assert.deepEqual(parseProgress(JSON.stringify({version: 1, cards: progress}), cards), progress);
const vocabulary = Object.fromEntries(buildVocabulary(source).map(w => [w.id, {learned: true, stage: 2, due: 4000, attempts: 6}]));
const snapshot = {profile: null, kanji: progress, vocabulary, forge: state};
const imported = parseBackup(JSON.stringify(createBackup(snapshot, 1000)), cards, subjects);
assert.equal(imported.skipped, 0); assert.deepEqual(imported.progress, snapshot);
assert.deepEqual(parseBackup(JSON.stringify(state), cards, subjects).progress.forge, state, 'legacy standalone Forge files remain readable');
assert.deepEqual(subjects.map(s => canLearn(s, emptyForge())), legacy.map(s => canLearn(s, emptyForge())), 'learning gates are unchanged');

const rest = subjects.find(s => s.id === 'k:休');
assert.deepEqual(rest.components, [{subjectId: 'k:人', form: '亻'}, {subjectId: 'k:木', form: '木'}]);
assert.deepEqual(rest.prerequisites, legacy.find(s => s.id === rest.id).prerequisites, 'teaching links are not scheduling prerequisites');
assert.deepEqual(subjects.find(s => s.id === 'k:一').components, [], 'no invented decomposition for unauthored kanji');

// Correcting display reading must not change the published vocabulary progress key.
const edited = clone(source), revision = clone(manifest), word = revision.vocabulary[0];
const label = `${word.text}（${word.reading}）`;
for (const card of edited) for (const example of card.examples) if (example[0] === label) example[0] = `${word.text}（テスト）`;
const oldId = word.id.slice(2); word.reading = 'テスト'; revision.curriculumVersion = '1.0.1';
const corrected = buildVocabulary(applyCurriculum(edited, revision));
assert.equal(corrected.find(w => w.id === oldId).reading, 'テスト');
assert.equal(corrected.length, buildVocabulary(source).length);

for (const mutate of [
 m => m.schemaVersion = 2, m => m.curriculumVersion = '', m => m.curriculumVersion = 'latest',
 m => m.kanji.pop(), m => m.kanji.push(clone(m.kanji[0])), m => m.kanji[0].level = 104,
 m => m.kanji[0].level = 2, m => m.kanji[0].radicalId = 'r:unknown', m => m.kanji[0].id = 'k:renamed',
 m => m.vocabulary.pop(), m => m.vocabulary.push(clone(m.vocabulary[0])),
 m => m.vocabulary[1].id = m.vocabulary[0].id, m => m.vocabulary[0].id = 'bad',
 m => m.vocabulary.push({id: 'v:unused', text: 'unused', reading: 'unused'}),
 m => m.kanji[0].components = [{subjectId: 'k:unknown', form: '?'}],
 m => m.kanji[0].components = [{subjectId: m.kanji[0].id, form: '一'}],
 m => {m.kanji[0].components = [{subjectId: m.kanji[1].id, form: '一'}]; m.kanji[1].components = [{subjectId: m.kanji[0].id, form: '一'}];},
 m => m.kanji[0].components = [null],
 m => m.kanji[0].components = [{subjectId: 'k:木', form: ''}],
 m => m.kanji[0].components = [{subjectId: 'k:木', form: '木'}, {subjectId: 'k:木', form: '木'}]
]) { const broken = clone(manifest); mutate(broken); assert.throws(() => applyCurriculum(source, broken), /Invalid curriculum/); }
assert.throws(() => applyCurriculum(source, null), /Invalid curriculum/);
assert.throws(() => buildLevels([cards[0], ...source.slice(1)]), /Mixed/);
assert.throws(() => buildLevels(cards.map((c,i) => i ? c : {...c, curriculum: {...c.curriculum, level: 104}})), /Invalid/);
console.log('PASS: registry coverage; stable IDs and levels; unchanged gates; every legacy progress key and backup; reading corrections; component references/cycles; fail-closed release validation.');
