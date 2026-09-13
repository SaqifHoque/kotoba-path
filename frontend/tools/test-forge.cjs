const assert=require('node:assert/strict');
const e=require(process.argv[2]);
const cards=require('../src/assets/kanji-curriculum.json');
const subjects=e.buildForge(cards), byId=new Map(subjects.map(s=>[s.id,s]));
assert.equal(subjects.filter(s=>s.kind==='kanji').length,1234);
assert.equal(new Set(subjects.map(s=>s.id)).size,subjects.length);
for(const s of subjects){assert(s.meaning);for(const id of s.prerequisites){assert(byId.has(id));assert(byId.get(id).level<=s.level);}}
let state=e.emptyForge(),now=100000;
const radical=subjects.find(s=>s.kind==='radical'&&s.level===1),kanji=subjects.find(s=>s.kind==='kanji'&&s.prerequisites.includes(radical.id));
assert(e.canLearn(radical,state));assert(!e.canLearn(kanji,state));
state=e.learn(radical,subjects,state,now);assert.equal(state.records[radical.id].meaning.stage,1);
assert.equal(e.review(radical,'meaning',true,subjects,state,now),state,'cannot grind early reviews');
for(let i=0;i<4;i++){now=state.records[radical.id].meaning.due;state=e.review(radical,'meaning',true,subjects,state,now);}
assert.equal(e.mastery(state.records[radical.id]),5);assert(e.canLearn(kanji,state));
state=e.learn(kanji,subjects,state,now);assert(state.records[kanji.id].reading);
for(let i=0;i<4;i++){now=state.records[kanji.id].meaning.due;state=e.review(kanji,'meaning',true,subjects,state,now);}
assert.equal(e.mastery(state.records[kanji.id]),1,'meaning alone cannot unlock vocabulary');
assert.equal(state.records[kanji.id].reading.reviews,0);
const r=state.records[radical.id].meaning;now=r.due;
state=e.review(radical,'meaning',false,subjects,state,now);assert.equal(state.records[radical.id].meaning.stage,3);
for(let i=0;i<6;i++){now=state.records[radical.id].meaning.due;state=e.review(radical,'meaning',true,subjects,state,now);}
assert.equal(state.records[radical.id].meaning.stage,9);assert.equal(state.records[radical.id].meaning.due,null);
assert(!e.dueQuestions(subjects,state,now+1e12).some(q=>q.subject.id===radical.id));
assert(e.accepts(kanji,'meaning',kanji.meaning.split(',')[0]));
assert(e.accepts(kanji,'reading',kanji.readings[0]));assert(!e.accepts(kanji,'reading','まちがい'));
const guru={stage:5,due:now,reviews:4,correct:4,misses:0,updatedAt:now};
const record=()=>({meaning:{...guru},reading:{...guru},lessonAt:now-86400000,note:'',noteAt:0});
const level1=subjects.filter(s=>s.kind==='kanji'&&s.level===1);
let ready=e.emptyForge();
for(const k of level1.slice(0,10))ready.records[k.id]=record();
const eleventh=level1[10];ready.records[eleventh.id]=record();ready.records[eleventh.id].reading.stage=4;
ready=e.review(eleventh,'reading',true,subjects,ready,now);assert.equal(ready.unlockedLevel,2);
ready=e.review(level1[0],'meaning',false,subjects,ready,now);assert.equal(ready.unlockedLevel,2,'unlocks never relock');
const word=subjects.find(s=>s.kind==='vocabulary'&&s.prerequisites.every(id=>e.mastery(ready.records[id])>=5)&&s.level<=2);assert(word&&e.canLearn(word,ready));
const poor=record();poor.meaning={...guru,reviews:4,correct:1,misses:3};ready.records[eleventh.id]=poor;
assert(e.weakSubjects(subjects,ready).includes(eleventh));
assert(e.contrasts(byId.get('k:日'),subjects).some(s=>s.text==='目'));
const parsed=e.parseForge(JSON.parse(JSON.stringify(state)),subjects);assert.deepEqual(parsed,state);
const corrupt=JSON.parse(JSON.stringify(state));corrupt.records[radical.id].meaning.stage=10;assert.throws(()=>e.parseForge(corrupt,subjects));
assert.deepEqual(e.mergeForge(state,state),state);
const withNote=JSON.parse(JSON.stringify(state));withNote.records[kanji.id].note='Remember the shape';withNote.records[kanji.id].noteAt=now;
assert.equal(e.mergeForge(state,withNote).records[kanji.id].note,'Remember the shape');
const limit=e.emptyForge();limit.dailyLimit=5;
for(const s of subjects.filter(s=>s.kind==='radical').slice(0,5))limit.records[s.id]={meaning:{...guru,stage:1,due:now+10000},lessonAt:now,note:'',noteAt:0};
assert.equal(e.lessonAllowance(subjects,limit,now),0);
assert(e.lessonAllowance(subjects,e.emptyForge(),now)>0);
console.log('PASS: Forge catalog, prerequisite graph, separate skills, scheduled-only mastery, Guru gates, 90% unlocks, Burned, mistakes, notes, persistence, lesson limits.');
