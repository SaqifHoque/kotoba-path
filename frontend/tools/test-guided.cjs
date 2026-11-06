const assert = require('node:assert/strict'), path = require('node:path');
const root = process.argv[2];
const lesson = require(path.join(root,'chapters/guided-lesson.js'));
const {STARTER_CHAPTER: chapter} = require(path.join(root,'chapters/starter-chapter.js'));
const forge = require(path.join(root,'forge/forge-engine.js'));
const backup = require(path.join(root,'settings/progress-backup.js'));
const {buildVocabulary} = require(path.join(root,'learn/practice-engine.js'));
const {checkAnswer} = require(path.join(root,'learn/answer-checker.js'));
const cards = require('../src/assets/kanji-curriculum.json');
const subjects = forge.buildForge(cards), byId = new Map(subjects.map(subject => [subject.id,subject]));
const steps = lesson.lessonSteps(chapter), now = new Date(2026,10,6,10).getTime();
const clone = value => JSON.parse(JSON.stringify(value));
assert.equal(steps.length,38);
assert.equal(subjects.filter(subject => subject.id==='v:休日:きゅうじつ').length,1);
for(const word of chapter.words) {
  assert(byId.has(word.id)); assert.equal(checkAnswer(byId.get(word.id),'reading',word.reading).status,'correct');
}
assert.equal(checkAnswer(byId.get('v:休日:きゅうじつ'),'meaning','day off').status,'correct');
assert.equal(buildVocabulary(cards).some(word => word.id==='人:ひと'),false,'the separate reading path retains its catalog');
let state = {...forge.emptyForge(),dailyLimit:20}, session = lesson.beginLesson(chapter);
const initial = JSON.stringify(state);
for(let cursor=0;cursor<steps.length;cursor++) {
  const step = steps[cursor], before=clone(state), beforeSession=clone(session);
  if(step.kind==='check') {
    assert.equal(lesson.advanceLesson(session,chapter,subjects,state,undefined,now).session,session);
    assert.equal(lesson.advanceLesson(session,chapter,subjects,state,{cursor,result:{status:'incorrect'}},now).session,session);
    assert.equal(lesson.advanceLesson(session,chapter,subjects,state,{cursor,result:{status:'retry'}},now).session,session);
    assert.equal(lesson.advanceLesson(session,chapter,subjects,state,{cursor:cursor-1,result:{status:'correct'}},now).session,session);
  }
  const transition = lesson.advanceLesson(session,chapter,subjects,state,{cursor,result:{status:'correct'}},now);
  assert.equal(transition.blocked,false); assert.equal(transition.session.cursor,cursor+1);
  assert.deepEqual(state,before); assert.deepEqual(session,beforeSession);
  session=transition.session;state=transition.forge;
  if(step.kind==='check'&&step.skill==='reading') {
    assert.equal(state.records[step.subjectId].meaning.stage,1);assert.equal(state.records[step.subjectId].reading.stage,1);
    assert.equal(state.records[step.subjectId].meaning.due,now+forge.WAITS[1]);
    assert.equal(state.records[step.subjectId].meaning.reviews,0,'practice does not increment scheduled-review counters');
  } else assert.deepEqual(state,before,'study and partial checks never introduce records');
  assert.equal(state.unlockedLevel,1,'chapter introductions do not skip legacy levels');
}
assert.equal(Object.keys(state.records).length,11);
assert.equal(lesson.advanceLesson(session,chapter,subjects,state,undefined,now).session,session);
assert.equal(forge.dueQuestions(subjects,state,now).length,0);
assert.equal(forge.dueQuestions(subjects,state,now+forge.WAITS[1]).length,22,'new words participate in the shared scheduled queue');
const snapshot={profile:null,kanji:{},vocabulary:{},forge:state};
assert.deepEqual(backup.parseBackup(JSON.stringify(backup.createBackup(snapshot,now)),cards,subjects).progress,snapshot,'all new IDs survive unified export/import');
assert.deepEqual(forge.parseForge(state,subjects),state,'server/cache snapshot remains valid');
assert.equal(initial,JSON.stringify({...forge.emptyForge(),dailyLimit:20}));
const existing=clone(state);existing.records['k:人'].meaning.stage=9;existing.records['k:人'].meaning.due=null;
existing.records['k:人'].note='Keep my story';existing.records['k:人'].noteAt=123;
existing.meaningSynonyms['k:人']={values:['human'],updatedAt:456};
const existingBefore=clone(existing), humanReading=steps.findIndex(step=>step.kind==='check'&&step.subjectId==='k:人'&&step.skill==='reading');
const old=lesson.advanceLesson({...lesson.beginLesson(chapter),cursor:humanReading},chapter,subjects,existing,{cursor:humanReading,result:{status:'correct'}},now);
assert.equal(old.forge,existing);assert.deepEqual(existing,existingBefore,'replay preserves burned tracks, notes, synonyms and due dates');
const cap={...clone(state),dailyLimit:10};delete cap.records['v:休日:きゅうじつ'];
const holidayStudy=steps.findIndex(step=>step.kind==='study'&&step.subjectId==='v:休日:きゅうじつ');
assert.equal(lesson.advanceLesson({...lesson.beginLesson(chapter),cursor:holidayStudy},chapter,subjects,cap,undefined,now).blocked,true);
assert.equal(lesson.advanceLesson({...lesson.beginLesson(chapter),cursor:holidayStudy},chapter,subjects,cap,undefined,now+86400000).blocked,true,'overdue workload also pauses new lessons');
const recovered=lesson.reconcileLesson(session,chapter,{...state,records:{...state.records,'k:人':undefined}});
assert.equal(recovered.cursor,humanReading-2,'a saved cursor cannot bypass a lost introduction');
assert.deepEqual(lesson.parseLesson(clone(session),chapter),session);
for(const mutate of [s=>s.version=2,s=>s.chapterId='other',s=>s.chapterVersion='9.0.0',s=>s.cursor=-1,s=>s.cursor=1.5,s=>s.cursor=39]){
 const invalid=clone(session);mutate(invalid);assert.throws(()=>lesson.parseLesson(invalid,chapter));
}
console.log('PASS: 38-step flow; feedback gating; 11 paced introductions; existing/Burned record preservation; 4-hour reviews; shared word IDs and backups; daily/workload pauses; corrupt/stale resume recovery.');
