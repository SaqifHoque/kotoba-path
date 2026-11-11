const assert=require('node:assert/strict'),path=require('node:path');
const root=process.argv[2],e=require(path.join(root,'reviews/review-session.js')),f=require(path.join(root,'forge/forge-engine.js'));
const {acceptedMeanings}=require(path.join(root,'learn/answer-checker.js'));
const cards=require('../src/assets/kanji-curriculum.json'),subjects=f.buildForge(cards),byId=new Map(subjects.map(s=>[s.id,s])),now=1000000000;
const track=(stage=4,due=now-100)=>({stage,due,reviews:5,correct:4,misses:1,updatedAt:now-10000});
const record=(subject,stage=4)=>({meaning:track(stage),...(subject.readings.length?{reading:track(stage)}:{}),lessonAt:100,note:'Keep this memory',noteAt:200});
const seed=()=>{const state=f.emptyForge();for(const subject of subjects.slice(0,35))state.records[subject.id]=record(subject);return state};
const clone=value=>JSON.parse(JSON.stringify(value));
const answer=question=>question.skill==='meaning'?acceptedMeanings(question.subject)[0]:question.subject.readings[0];
let state=seed();const original=clone(state);
for(const limit of [10,20,40]){const batch=e.createReviewBatch(subjects,state,limit,now);assert.equal(batch.tickets.length,limit);assert.equal(batch.outcomes.length,0)}
assert.throws(()=>e.createReviewBatch(subjects,state,5,now));
let batch=e.createReviewBatch(subjects,state,10,now),q=batch.tickets[0].question;
const submission=e.submitReview(batch,subjects,state,answer(q),now);
assert.deepEqual(state,original);assert.equal(batch.outcomes.length,0);assert.equal(submission.batch.outcomes.length,1);assert.equal(submission.attempt.kind,'scheduled');assert.equal(submission.attempt.subject,q.subject.id);
assert.equal(submission.forge.records[q.subject.id][q.skill].stage,5);assert.equal(submission.forge.records[q.subject.id][q.skill].due,now+7*86400000);assert.equal(submission.forge.records[q.subject.id][q.skill].reviews,6);
assert.equal(submission.forge.records[q.subject.id].note,'Keep this memory');assert.equal(submission.batch.cursor,0,'submission saves without waiting for Continue');
assert.equal(e.nextReview(batch),batch,'cannot move past an unanswered question');
const double=e.submitReview(submission.batch,subjects,submission.forge,answer(q),now);assert.equal(double.forge,submission.forge);assert.equal(double.batch,submission.batch);assert.equal(double.attempt,undefined);
assert.equal(e.nextReview(submission.batch).cursor,1);
assert.equal(e.submitReview(e.finishReview(batch),subjects,state,answer(q),now).attempt,undefined);
const finish=e.finishReview(submission.batch),summary=e.reviewSummary(finish);assert.equal(summary.answered,1);assert.equal(summary.remaining,9);assert.equal(summary.accuracy,100);assert.equal(summary.subjects,1);
assert.equal(finish.outcomes,submission.batch.outcomes,'finishing never scores untouched questions');

// Review only one skill when the other is future/Burned; never bring it forward.
const person=byId.get('k:人'),single=f.emptyForge();single.records[person.id]=record(person,5);single.records[person.id].reading={...track(9),due:null};
let one=e.createReviewBatch(subjects,single,10,now);assert.equal(one.tickets.length,1);assert.equal(one.tickets[0].question.skill,'meaning');
const wrong=e.submitReview(one,subjects,single,'banana',now);assert.equal(wrong.feedback.status,'incorrect');assert.equal(wrong.forge.records[person.id].meaning.stage,3);assert.equal(wrong.forge.records[person.id].meaning.due,now+86400000);assert.deepEqual(wrong.forge.records[person.id].reading,single.records[person.id].reading);assert.equal(e.reviewSummary(wrong.batch).mistakes.length,1);
const retry=e.submitReview(one,subjects,single,'ひと',now);assert.equal(retry.feedback.status,'retry');assert.equal(retry.batch,one);assert.equal(retry.forge,single);assert.equal(retry.attempt,undefined);
const readingOnly=clone(single);readingOnly.records[person.id].meaning.due=now+5000;readingOnly.records[person.id].reading=track(8);one=e.createReviewBatch(subjects,readingOnly,10,now);assert.equal(one.tickets.length,1);
assert.equal(e.submitReview(one,subjects,readingOnly,'jin',now).feedback.status,'retry');
const burned=e.submitReview(one,subjects,readingOnly,person.readings[0],now);assert.equal(burned.forge.records[person.id].reading.stage,9);assert.equal(burned.forge.records[person.id].reading.due,null);

// A newer track is skipped; note/synonym edits do not erase or invalidate a due answer.
for(const mutate of [t=>t.stage++,t=>t.due=now+1000,t=>t.reviews++,t=>t.updatedAt++,t=>t.correct++,t=>t.misses++]){
 const changed=clone(state);mutate(changed.records[q.subject.id][q.skill]);const before=clone(changed),skipped=e.submitReview(batch,subjects,changed,answer(q),now);
 assert.equal(skipped.feedback.status,'skipped');assert.equal(skipped.forge,changed);assert.deepEqual(changed,before);assert.equal(skipped.attempt,undefined);assert.equal(e.reviewSummary(skipped.batch).skipped,1);assert.equal(e.reviewSummary(skipped.batch).accuracy,null);
 assert.equal(e.nextReview(skipped.batch).cursor,1);assert.equal(e.submitReview(skipped.batch,subjects,changed,answer(q),now).attempt,undefined);
}
const notes=clone(state);notes.records[q.subject.id].note='A newer story';notes.records[q.subject.id].noteAt=12345;
assert.equal(e.submitReview(batch,subjects,notes,answer(q),now).forge.records[q.subject.id].note,'A newer story');
const gone=clone(state);delete gone.records[q.subject.id];assert.equal(e.submitReview(batch,subjects,gone,answer(q),now).feedback.status,'skipped');
assert.equal(e.submitReview(batch,subjects.filter(s=>s.id!==q.subject.id),state,answer(q),now).feedback.status,'skipped');

// A complete mixed batch has honest question/subject counts and no repeated tracks.
state=seed();batch=e.createReviewBatch(subjects,state,20,now);const keys=new Set();
while(batch.cursor<batch.tickets.length){q=batch.tickets[batch.cursor].question;const key=q.subject.id+':'+q.skill;assert(!keys.has(key));keys.add(key);const next=e.submitReview(batch,subjects,state,answer(q),now);state=next.forge;batch=e.nextReview(next.batch)}
const complete=e.reviewSummary(batch);assert.equal(complete.answered,20);assert.equal(complete.correct,20);assert.equal(complete.remaining,0);assert(complete.subjects<=20);assert.equal(complete.subjects,complete.totalSubjects);
assert.equal(e.submitReview(batch,subjects,state,'anything',now).attempt,undefined);
const empty=e.createReviewBatch(subjects,f.emptyForge(),20,now);assert.equal(empty.tickets.length,0);assert.equal(e.reviewSummary(empty).accuracy,null);
console.log('PASS: due-only batch sizes; immediate single scoring; stage/interval parity; format retries; independent/Burned tracks; stale-state skips; pause/finish safety; note preservation; honest question/subject summaries.');
