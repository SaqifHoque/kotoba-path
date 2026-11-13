const assert = require('node:assert/strict');
const path = require('node:path');
const root = process.argv[2];
const engine = require(path.join(root,'reading/reading-session.js'));
const {STARTER_READING:cards} = require(path.join(root,'reading/starter-reading.js'));
const {validateReading} = require(path.join(root,'reading/reading-content.js'));
validateReading(cards);
assert.equal(cards.length,7);
assert.equal(cards[2].target.reading,'やすみます');
const original = JSON.stringify(cards);
let s = engine.beginReading(cards);
assert.equal(engine.advanceReading(s),s);
assert.equal(engine.chooseReading(s,0),s); // reading must precede comprehension
let retry = engine.submitReading(s,'hito');
assert.equal(retry.feedback.status,'retry');
assert.equal(retry.session,s);
s = engine.submitReading(s,'ヒト').session;
assert.equal(s.attempts[0].reading.correct,true);
assert.equal(engine.submitReading(s,'き').session,s); // first result immutable
s = engine.supportReading(s,'lookup');
s = engine.chooseReading(s,cards[0].questions[0].correct);
assert.equal(s.attempts[0].reading.supported,false);
assert.equal(s.attempts[0].answers[0].supported,true);
assert.equal(engine.chooseReading(s,0),s);
s = engine.advanceReading(s);
s = engine.supportReading(s,'kana');
s = engine.submitReading(s,'き').session;
assert.equal(s.attempts[1].reading.supported,true);
s = engine.chooseReading(s,cards[1].questions[0].correct);
s = engine.advanceReading(s);
s = engine.submitReading(s,'やすむ').session; // actual conjugated form required
assert.equal(s.attempts[2].reading.correct,false);
s = engine.chooseReading(s,cards[2].questions[0].correct);
s = engine.advanceReading(s);
while (!s.closed) {
  const c = engine.currentCard(s);
  if (c.target) s = engine.submitReading(s,c.target.reading).session;
  s = engine.chooseReading(s,c.questions[s.question].correct);
  s = engine.advanceReading(s);
}
assert.deepEqual(engine.readingSummary(s),{completed:7,total:7,readings:6,readingCorrect:5,readingIndependent:4,answered:8,correct:8,supported:2,questionTotal:8});
assert.equal(engine.advanceReading(s),s);
assert.equal(engine.supportReading(s,'meaning'),s);
assert.equal(engine.currentCard(s),undefined);
assert.equal(JSON.stringify(cards),original);
let single = engine.beginReading(cards,cards[2].wordId);
assert.equal(single.cards.length,1);
single = engine.submitReading(single,'').session;
single = engine.chooseReading(single,0);
single = engine.advanceReading(single);
assert.equal(single.closed,true);
assert.equal(engine.readingSummary(single).correct,0);
assert.equal(engine.readingSummary({...engine.beginReading(cards),closed:true}).answered,0);
assert.throws(()=>engine.beginReading(cards,'invalid'));
for (const mutate of [
  c=>{c[0].id=c[1].id;},
  c=>{c[0].text='新しい';},
  c=>{c[0].target.reading='rest';},
  c=>{c[6].text+='新';},
  c=>{c[6].questions[0].correct=99;},
  c=>{c[6].questions[0].choices=['same','same'];}
]) {const copy=structuredClone(cards); mutate(copy); assert.throws(()=>validateReading(copy));}
const start=engine.beginReading(cards);
const grammar=engine.supportReading(start,'grammar');
assert.deepEqual(grammar.attempts[0].support,['grammar']);
assert.equal(engine.supportReading(grammar,'grammar'),grammar);
for(const choice of [-1,NaN,0.5,99]) assert.equal(engine.chooseReading(start,choice),start);
console.log('Reading: content coverage, conjugation, kana retries, first answers, support snapshots, passage order, early finish and immutable sources pass.');
