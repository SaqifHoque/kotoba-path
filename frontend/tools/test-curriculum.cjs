const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {buildLevels} = require(path.resolve(process.argv[2]));
const cards = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/assets/kanji-curriculum.json'), 'utf8'));

(async () => {
  const {parseCsv, generateCurriculum} = await import('./generate-kanji-curriculum.mjs');
  assert.deepEqual(parseCsv('a,b\r\n"x,y","a ""quote""\nand newline"\r\n'), [{a:'x,y', b:'a "quote"\nand newline'}]);
  assert.throws(() => parseCsv('a,b\n"unclosed'));
  assert.deepEqual(generateCurriculum(), cards);
  const source = parseCsv(fs.readFileSync(path.join(__dirname, '../../datasets/kanji-alive/ka_data.csv'), 'utf8'));
  assert.equal(source.length, 1235);
  assert.deepEqual(new Set(cards.map(c => c.character)), new Set(source.filter(r => r.kanji !== '々').map(r => r.kanji)));
  assert.equal(cards.length, 1234);
  assert(cards.every(c => c.meaning && c.examples.length && (c.onyomi || c.kunyomi)));
  const levels = buildLevels(cards);
  assert.equal(levels.length, 103);
  assert.equal(levels.filter(l => l.cards.length === 12).length, 101);
  assert.equal(levels.filter(l => l.cards.length === 11).length, 2);
  assert(levels.every((l,i) => l.number === i+1 && l.cards.length >= 10 && l.cards.length <= 12));
  assert.deepEqual(levels.flatMap(l => l.cards), cards);
  assert.equal(new Set(levels.flatMap(l => l.cards.map(c => c.character))).size, 1234);
  assert.throws(() => buildLevels([]));
  assert.throws(() => buildLevels(cards.slice(0, 8)));
  assert.throws(() => buildLevels([...cards, cards[0]]));
  assert.deepEqual(buildLevels(cards), levels);
  console.log('PASS: CSV quoting, source coverage, unique kanji, level sizes and numbering, determinism, invalid input.');
})().catch(error => {console.error(error); process.exitCode = 1;});
