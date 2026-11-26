const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),vm=require('node:vm');
const ts=require('typescript'),root=process.argv[2];
const t=require(path.join(root,'reviews/trouble-spots.js')),p=require(path.join(root,'reviews/mistake-practice.js'));
const f=require(path.join(root,'forge/forge-engine.js'));
const catalog=f.buildForge(require('../src/assets/kanji-curriculum.json'));
const person=catalog.find(s=>s.id==='k:人'),word=catalog.find(s=>s.id==='v:人:ひと'),radical=catalog.find(s=>s.kind==='radical');
const now=20000;
const track=(misses=3,correct=0,due=now)=>({stage:3,due,reviews:misses+correct,correct,misses,updatedAt:1000});
const record=(meaning,reading)=>({meaning,...(reading?{reading}:{}),lessonAt:1000,note:'Picture a person walking',noteAt:1000});
const forge={...f.emptyForge(),records:{
 [person.id]:record(track(3,11),track(4,0,now+10000)),
 [word.id]:record(track(3,12),track(2,0)),
 [radical.id]:record(track(3,0))},meaningSynonyms:{[person.id]:{values:['someone'],updatedAt:1000}}};
const original=JSON.stringify(forge),catalogBefore=JSON.stringify(catalog);
let all=t.troubleSpots([...catalog,person],forge,now);
assert.equal(all.length,3); // 3/15 misses is exactly 80% correct: excluded.
assert.equal(all[0].subject,person);assert.equal(all[0].skill,'reading');assert.equal(all[0].due,false);
assert.equal(all.find(i=>i.subject===person&&i.skill==='meaning').due,true);
assert.equal(t.troubleSpots(catalog,{...forge,records:{}},now).length,0);
const retired={...forge,records:{[person.id]:record({...track(),stage:9,due:null})}};
assert.equal(t.troubleSpots(catalog,retired,now).length,0);
// Missing catalog IDs and unsupported radical readings never enter the list.
assert.equal(t.troubleSpots([radical],{...forge,records:{[radical.id]:record(track(2),track(9)),'k:missing':record(track(9))}},now).length,0);
const filters=t.defaultTroubleFilters();
assert.equal(t.filterTroubleSpots(all,{...filters,skill:'reading'}).length,1);
assert.equal(t.filterTroubleSpots(all,{...filters,timing:'due'}).length,2);
assert.equal(t.filterTroubleSpots(all,{...filters,kind:'vocabulary'}).length,0);
assert.equal(t.filterTroubleSpots(all,{...filters,query:'ＳＯＭＥＯＮＥ ニン'}).length,2);
assert.equal(t.filterTroubleSpots(all,{...filters,query:'missing'}).length,0);
assert.equal(t.troubleSpots(catalog,forge,now+10000)[0].due,true);
assert.equal(t.troublePracticeQuestions(Array(15).fill(all[0])).length,10);
assert.deepEqual(t.troubleSpots([...catalog].reverse(),forge,now).map(i=>i.subject.id+i.skill),all.map(i=>i.subject.id+i.skill));
const stale={...person,meaning:'obsolete'};
let session=p.createQuestionPractice([{subject:stale,skill:'meaning'},{subject:person,skill:'meaning'},
 {subject:person,skill:'reading'},{subject:radical,skill:'reading'},{subject:{...person,id:'k:missing'},skill:'meaning'}],catalog);
assert.equal(session.questions.length,2);assert.equal(session.questions[0].subject,person);
assert.equal(p.submitPractice(session,'someone',['someone']).feedback.status,'correct');
// Run the actual tab services with injected fake boundaries, using the project's TypeScript compiler.
function service(file,name){
 const compiled=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/app/features/reviews',file),'utf8'),
  {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText;
 const exports={};
 vm.runInNewContext(compiled,{exports,Date,Set,Map,JSON,require:id=>id==='@angular/core'?{Injectable:()=>target=>target}:require(path.join(root,'reviews',id))});
 return exports[name];
}
const sync={ready:true,forgeSubjects:catalog,state:{value:{forge}}},account={account:{id:'guest'},changing:false};
const Spots=service('trouble-spots.service.ts','TroubleSpotsService'),spots=new Spots(sync,account);
assert.equal(spots.snapshot(now).total,3);
spots.filters.query='someone';spots.limit=40;spots.returnItem='old';
assert.equal(spots.snapshot(now).matched,2);
account.changing=true;assert.equal(spots.snapshot(now),null);account.changing=false;
account.account.id='other';assert.equal(spots.snapshot(now).matched,3);assert.equal(spots.filters.query,'');assert.equal(spots.limit,20);assert.equal(spots.returnItem,'');
spots.filters.skill='reading';spots.reset();assert.equal(spots.filters.skill,'all');
const Reviews=service('mistake-practice.service.ts','MistakePracticeService');
const batch={outcomes:[],closed:true},reviews={allowed:true,complete:true,batch};
const practice=new Reviews(sync,account,reviews);
assert.equal(practice.beginTroubleSpots({...filters,query:'missing'}),false);
assert.equal(practice.beginTroubleSpots({...filters,skill:'reading'}),true);
assert.equal(practice.session.questions.length,1);assert.equal(practice.returnView,'trouble-spots');
practice.draft='jin';practice.check();assert.equal(practice.feedback.status,'retry');assert.equal(practice.session.results.length,0);
practice.draft='ニン';practice.check();assert.equal(practice.result.answer.status,'correct');
practice.draft='wrong';practice.check();assert.equal(practice.result.answer.status,'correct');
practice.next();assert.equal(practice.complete,true);assert.equal(practice.summary.unanswered,0);
practice.restart();assert.equal(practice.summary.answered,0);practice.finish();assert.equal(practice.summary.unanswered,1);
account.account.id='new';assert.equal(practice.allowed,false);
sync.ready=false;assert.equal(practice.beginTroubleSpots(filters),false);sync.ready=true;
assert.equal(practice.beginTroubleSpots(filters),true);
practice.clear();assert.equal(practice.session,null);assert.equal(practice.returnView,'typed-review');
// Existing batch-origin practice and same-source draft resume remain intact.
reviews.batch={...batch,outcomes:[{kind:'scored',correct:false,question:{subject:person,skill:'meaning'}}]};
assert.equal(practice.begin(),true);assert.equal(practice.returnView,'typed-review');
practice.draft='preserve me';assert.equal(practice.begin(),true);assert.equal(practice.draft,'preserve me');
// New saved counters invalidate snapshots, including recovery above the threshold.
spots.snapshot(now);sync.state.value={forge:{...forge,records:{}}};assert.equal(spots.snapshot(now).total,0);
assert.equal(JSON.stringify(forge),original);assert.equal(JSON.stringify(catalog),catalogBefore);
console.log('PASS trouble spots: thresholds, independent skills, canonical selection, deterministic priority, filters, due boundary, ten-question cap, account/loading/import reset, source return, first answers, same-batch resume and unchanged saved data.');
