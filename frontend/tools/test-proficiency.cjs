const assert = require('node:assert/strict');
const proficiency = require(process.argv[2]);
const cards = require('../src/assets/kanji-curriculum.json');

assert.equal(proficiency.targetBand(null), 'N5');
assert.equal(proficiency.targetBand({level: 'unsure', familiarity: 'comfortable', updatedAt: 1}), 'N5');
assert.equal(proficiency.targetBand({level: 'N3', familiarity: 'studying', updatedAt: 1}), 'N3');
assert.equal(proficiency.targetBand({level: 'N3', familiarity: 'comfortable', updatedAt: 1}), 'N2');
assert.equal(proficiency.targetBand({level: 'N1', familiarity: 'comfortable', updatedAt: 1}), 'N1');

const n3 = {level: 'N3', familiarity: 'studying', updatedAt: 1};
const progress = {};
const recommended = proficiency.recommendedCards(cards, n3, progress);
assert(recommended.length > 0);
assert(recommended.every(card => ['N3', 'N2', 'N1'].includes(proficiency.estimatedBand(card))));
assert(!recommended.some(card => card.character === '日'));
const assumed = proficiency.assumedKanji(cards, n3, progress);
assert(assumed.includes('日'));
assert.deepEqual(progress, {}); // Choosing a starting band never manufactures review progress.
assert(!proficiency.assumedKanji(cards, n3, {日: {learned: false, stage: 0, due: 1, attempts: 1}}).includes('日'));
assert(proficiency.recommendedCards(cards, {level: 'N5', familiarity: 'studying', updatedAt: 2}, {})
  .some(card => card.character === '日'));

assert.equal(proficiency.placementSuggestion('N3', 0), 'N4');
assert.equal(proficiency.placementSuggestion('N3', 3), 'N3');
assert.equal(proficiency.placementSuggestion('N3', 5), 'N2');
assert.equal(proficiency.placementSuggestion('N5', 0), 'N5');
assert.equal(proficiency.placementSuggestion('N1', 5), 'N1');
console.log('PASS: proficiency targeting, assumed knowledge, recommendations, and placement boundaries.');
