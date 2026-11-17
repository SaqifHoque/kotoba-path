const assert=require('node:assert/strict'),path=require('node:path');
const root=process.argv[2],q=require(path.join(root,'quests/study-quests.js'));
const {chapterProgress}=require(path.join(root,'chapters/chapter-progress.js'));
const {STARTER_CHAPTER:chapter}=require(path.join(root,'chapters/starter-chapter.js'));
const {emptyForge}=require(path.join(root,'forge/forge-engine.js'));
const now=new Date(2026,10,17,12).getTime(),w=q.activityWindow(now);
assert.equal(w.from,new Date(2026,10,17).getTime());assert.equal(w.to,now+1);
const event=(id,skill='meaning',at=now)=>({id:String(id),mode:'forge',subject:'k:人',label:'人',skill,kind:'scheduled',outcome:'incorrect',occurredAt:at});
const events=[...Array.from({length:300},(_,i)=>event(i)),event('reading','reading')];
const selected=q.pendingCandidates(events,w);
assert.equal(selected.length,6);assert(selected.some(e=>e.skill==='reading'));
assert.deepEqual(q.questProgress(w,selected),{recalls:5,skills:2,petals:3,complete:true});
const server={from:w.from,to:w.to,recalls:5,meaning:true,reading:true,includedPendingIds:selected.map(e=>e.id)};
assert.deepEqual(q.questProgress(w,selected,server),q.questProgress(w,[],server));
assert.equal(q.questProgress(w,[event('a')],{...server,recalls:1,reading:false,includedPendingIds:['a']}).recalls,1);
assert.equal(q.questProgress(w,[event('new','reading')],{...server,recalls:1,reading:false,includedPendingIds:[]}).petals,1);
assert.equal(q.questProgress(w,[event('both','both')]).skills,2);
assert.equal(q.questProgress(w,[event('a'),event('a')]).recalls,1);
const excluded=[{...event(1),kind:'learning'},event(2,'both',w.from-1),event(3,'both',now+1)];
assert.equal(q.questProgress(w,excluded).recalls,0);
assert.equal(q.questProgress(w,[event('start','reading',w.from)]).recalls,1);
assert.throws(()=>q.parseActivity({...server,recalls:6},w));
assert.throws(()=>q.parseActivity({...server,to:w.to+1},w));
assert.throws(()=>q.parseActivity({...server,reading:'yes'},w));
const forge=emptyForge();let badges=q.studyBadges(forge,chapterProgress(chapter,forge,now));
assert(badges.every(b=>!b.earned));
for(const id of [...chapter.kanji.map(k=>k.subjectId),...chapter.words.map(w=>w.id)]){
 const track={stage:5,due:now+1000,reviews:4,correct:4,misses:0,updatedAt:now};
 forge.records[id]={meaning:{...track},reading:{...track},lessonAt:now,note:'Keep',noteAt:now};
}
const original=JSON.stringify(forge);
assert(q.studyBadges(forge,chapterProgress(chapter,forge,now)).every(b=>b.earned));
assert.equal(JSON.stringify(forge),original);
forge.records['k:人'].reading.stage=3;
assert.equal(q.studyBadges(forge,chapterProgress(chapter,forge,now))[2].earned,false);
assert.equal(q.studyBadges(forge,chapterProgress(chapter,forge,now))[1].earned,true);
assert.equal(q.questProgress(q.activityWindow(new Date(2026,10,18).getTime()),events).petals,0);
console.log('PASS quests: effort including mistakes, capped goals, skill coverage, receipt dedupe, server overlap, future/day boundaries, current badges and unchanged progress.');
const previousZone=process.env.TZ;
process.env.TZ='America/New_York';
for(const [month,day,hours] of [[2,8,23],[10,1,25]]){
 const end=new Date(2026,month,day,23,59,59,999).getTime();
 const dayWindow=q.activityWindow(end);
 assert.equal(dayWindow.to-dayWindow.from,hours*3600000);
}
if(previousZone===undefined)delete process.env.TZ;else process.env.TZ=previousZone;
console.log('PASS quests: local calendar boundaries include 23-hour and 25-hour DST days.');
