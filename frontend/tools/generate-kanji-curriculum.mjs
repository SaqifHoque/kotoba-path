import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Parse quoted CSV fields (including embedded commas, quotes and newlines).
export function parseCsv(text) {
  const rows = []; let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (quoted && text[i + 1] === '"') { field += '"'; i++; }
      else quoted = !quoted;
    } else if (!quoted && (c === ',' || c === '\n' || c === '\r')) {
      row.push(field); field = '';
      if (c !== ',') {
        if (row.some(Boolean)) rows.push(row);
        row = [];
        if (c === '\r' && text[i + 1] === '\n') i++;
      }
    } else field += c;
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  if (field || row.length) { row.push(field); rows.push(row); }
  const headers = rows.shift();
  return rows.map(values => Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ''])));
}

export function generateCurriculum() {
const rows = parseCsv(readFileSync(new URL('../../datasets/kanji-alive/ka_data.csv', import.meta.url), 'utf8'));
const clean = value => value.trim().toLowerCase() === 'n/a' ? '' : value.trim();
// 々 repeats the previous kanji; it has no independent reading to recall.
const cards = rows.filter(r => r.kanji !== '々').map(r => ({
  character: r.kanji, meaning: r.kmeaning, onyomi: clean(r.onyomi_ja), kunyomi: clean(r.kunyomi_ja),
  grade: Number(r.kgrade) || 99, strokes: Number(r.kstroke), radical: r.radical,
  radicalMeaning: r.rad_meaning, examples: JSON.parse(r.examples).slice(0, 3)
}));
if (new Set(cards.map(c => c.character)).size !== cards.length) throw new Error('Duplicate kanji');
// Grade, then stroke count and code point: deterministic, beginning with simpler school kanji.
cards.sort((a, b) => a.grade - b.grade || a.strokes - b.strokes || a.character.codePointAt(0) - b.character.codePointAt(0));
if (cards.length < 1200 || cards.some(c => !c.character || !c.meaning)) throw new Error('Incomplete catalog');
return cards;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const cards = generateCurriculum();
  const output = new URL('../src/assets/kanji-curriculum.json', import.meta.url);
  const serialized = JSON.stringify(cards) + '\n';
  if (process.argv.includes('--check')) {
    if (readFileSync(output, 'utf8') !== serialized) throw new Error('Curriculum is stale: run npm run generate:kanji');
    console.log('Catalog matches its source.');
  } else {
    writeFileSync(output, serialized);
    console.log(`Generated ${cards.length} unique kanji from Kanji Alive.`);
  }
}
