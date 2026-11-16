const assert = require('node:assert/strict');
const path = require('node:path');
const root = process.argv[2];
const {chapterProgress} = require(path.join(root,'chapters/chapter-progress.js'));
const {STARTER_CHAPTER:chapter} = require(path.join(root,'chapters/starter-chapter.js'));
const f = require(path.join(root,'forge/forge-engine.js'));
const r = require(path.join(root,'reviews/review-session.js'));
const subjects = f.buildForge(require('../src/assets/kanji-curriculum.json'));
const now = 2000000000000;
const clone = value => structuredClone(value);
let state = f.emptyForge();
let p = chapterProgress(chapter,state,now);
assert.equal(p.next,'lessons');
assert.equal(p.items.length,11);
assert.equal(p.introducedKanji,0);
assert.equal(p.retentionReached,false);
const ids = p.subjectIds;
for (const id of ids) state.records[id] = f.newForgeRecord(subjects.find(s=>s.id===id),now);
const original = JSON.stringify(state);
p = chapterProgress(chapter,state,now);
assert.equal(p.introductionsComplete,true);
assert.equal(p.retentionReached,false);
assert.equal(p.next,'wait');
assert.equal(p.nextReviewAt,now+f.WAITS[1]);
assert.equal(p.dueQuestions,0);
assert.equal(JSON.stringify(state),original);
p = chapterProgress(chapter,state,now+f.WAITS[1]);
assert.equal(p.next,'reviews');
assert.equal(p.dueQuestions,22);
assert.equal(p.dueSubjects,11);
// Another course subject must not enter chapter counts or scoped batches.
const outside = subjects.find(s=>s.kind==='kanji'&&!ids.includes(s.id));
state.records[outside.id] = f.newForgeRecord(outside,now-999999999);
p = chapterProgress(chapter,state,now+f.WAITS[1]);
assert.equal(p.dueQuestions,22);
assert.equal(r.createReviewBatch(subjects,state,20,now+f.WAITS[1],ids).tickets.length,20);
assert.equal(r.createReviewBatch(subjects,state,20,now+f.WAITS[1],[]).tickets.length,0);
assert.equal(r.createReviewBatch(subjects,state,20,now+f.WAITS[1],['unknown']).tickets.length,0);
let batch = r.createReviewBatch(subjects,state,20,now+f.WAITS[1],ids);
assert(batch.tickets.every(t=>ids.includes(t.question.subject.id)));
const outsideBefore = clone(state.records[outside.id]);
while (batch.cursor < batch.tickets.length) {
  // Use I-don't-know so the check is deterministic across every source gloss.
  const result = r.submitReview(batch,subjects,state,'',now+f.WAITS[1]);
  assert(result.attempt);
  state = result.forge;
  batch = r.nextReview(result.batch);
}
assert.deepEqual(state.records[outside.id],outsideBefore);
const nextBatch = r.createReviewBatch(subjects,state,20,now+f.WAITS[1],ids);
assert.equal(nextBatch.tickets.length,2);
assert(nextBatch.tickets.every(t=>ids.includes(t.question.subject.id)));
assert(r.createReviewBatch(subjects,state,20,now+f.WAITS[1]).tickets.some(t=>t.question.subject.id===outside.id));
// Both independent tracks must reach Guru; Burned tracks are retained, never due.
state = f.emptyForge();
for(const id of ids) {
 state.records[id] = f.newForgeRecord(subjects.find(s=>s.id===id),now);
 for(const skill of ['meaning','reading']) state.records[id][skill] = {stage:5,due:now+5000,reviews:4,correct:4,misses:0,updatedAt:now};
}
p = chapterProgress(chapter,state,now);
assert.equal(p.next,'reading');
assert.equal(p.retainedKanji,5);assert.equal(p.retainedWords,6);
state.records[ids[0]].reading.stage=4;
assert.equal(chapterProgress(chapter,state,now).retainedKanji,4);
assert.equal(chapterProgress(chapter,state,now).retentionReached,false);
state.records[ids[0]].reading.stage=9;state.records[ids[0]].reading.due=null;
assert.equal(chapterProgress(chapter,state,now).retentionReached,true);
state.records[ids[0]].meaning.due=now;
assert.equal(chapterProgress(chapter,state,now).dueQuestions,1);
assert.equal(chapterProgress(chapter,state,now).next,'reviews');
delete state.records[ids[1]].reading;
assert.equal(chapterProgress(chapter,state,now).introducedKanji,4);
const duplicate=clone(chapter);duplicate.words.push(clone(duplicate.words[0]));
assert.throws(()=>chapterProgress(duplicate,state,now));
console.log('PASS chapter progression: saved introductions, independent Guru tracks, lapses/Burned, due boundaries, scoped batches, empty/unknown scopes, full-catalog grading and unchanged unrelated records.');
