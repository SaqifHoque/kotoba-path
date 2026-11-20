const assert=require('node:assert/strict'),path=require('node:path');
const root=process.argv[2],m=require(path.join(root,'memory/personal-memory.js'));
const {emptyForge}=require(path.join(root,'forge/forge-engine.js'));
const {checkAnswer}=require(path.join(root,'learn/answer-checker.js'));
const state=emptyForge();
const id='v:人:ひと',track={stage:5,due:123456,reviews:4,correct:4,misses:0,updatedAt:1000};
state.records[id]={meaning:{...track},reading:{...track},lessonAt:100,note:'Original',noteAt:200};
state.meaningSynonyms[id]={values:['human'],updatedAt:300};
const baseline=m.memorySnapshot(state,id),snapshot=structuredClone(state);
const updated=m.savePersonalMemory(state,baseline,'  A walking person  ','human\nperson over there',1000);
assert.deepEqual(state,snapshot);
assert.equal(updated.records[id].note,'A walking person');
assert.equal(updated.records[id].noteAt,1000);
assert.deepEqual(updated.records[id].meaning,state.records[id].meaning);
assert.deepEqual(updated.records[id].reading,state.records[id].reading);
assert.equal(updated.records[id].lessonAt,100);
assert.equal(updated.dailyLimit,state.dailyLimit);assert.equal(updated.unlockedLevel,state.unlockedLevel);
assert.deepEqual(updated.meaningSynonyms[id].values,['human','person over there']);
assert.equal(m.savePersonalMemory(updated,m.memorySnapshot(updated,id),'A walking person','person over there\nhuman',2000),updated);
const latest=structuredClone(state);latest.records[id].reading.stage=6;latest.records[id].reading.due=999999;
assert.deepEqual(m.savePersonalMemory(latest,baseline,'New note','human',1000).records[id].reading,latest.records[id].reading);
for(const change of [
 s=>{s.records[id].note='Other tab';},
 s=>{s.records[id].noteAt++;},
 s=>{s.meaningSynonyms[id].updatedAt++;},
 s=>{s.meaningSynonyms[id].values=['person'];}
]){
 const changed=structuredClone(state);change(changed);
 assert.throws(()=>m.savePersonalMemory(changed,baseline,'Draft','human',1000),m.MemoryConflict);
}
assert.throws(()=>m.savePersonalMemory(state,baseline,'New note','日本語',1000));
assert.throws(()=>m.savePersonalMemory(state,baseline,'x'.repeat(1001),'human',1000));
assert.throws(()=>m.savePersonalMemory(state,baseline,'New note',Array.from({length:9},(_,i)=>'meaning '+i).join('\n'),1000));
assert.deepEqual(state,snapshot);
const cleared=m.savePersonalMemory(state,baseline,'','',1000);
assert.equal(cleared.records[id].note,'');assert.deepEqual(cleared.meaningSynonyms[id].values,[]);
assert.equal(cleared.meaningSynonyms[id].updatedAt,1000);
const missing='k:木',empty=m.memorySnapshot(state,missing);
assert.throws(()=>m.savePersonalMemory(state,empty,'A tree','tree',1000));
const synonymOnly=m.savePersonalMemory(state,empty,'','wood',1000);
assert.equal(synonymOnly.records[missing],undefined);
assert.equal(checkAnswer({id:missing,kind:'kanji',meaning:'tree',readings:['モク']},'meaning','wood',synonymOnly.meaningSynonyms[missing].values).status,'correct');
const future=structuredClone(state);future.records[id].noteAt=5000;
assert.equal(m.savePersonalMemory(future,m.memorySnapshot(future,id),'Changed','human',1000).records[id].noteAt,5001);
const max=structuredClone(state);max.records[id].noteAt=8640000000000000;
assert.throws(()=>m.savePersonalMemory(max,m.memorySnapshot(max,id),'Changed','human',1000));
console.log('PASS memory: immutable stages/dates/notes, latest-track preservation, stale edit conflicts, atomic validation, clearing, synonym grading, no enrollment and monotonic timestamps.');
