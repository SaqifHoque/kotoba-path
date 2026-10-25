const assert=require('node:assert/strict'),path=require('node:path');
const root=process.argv[2], b=require(path.join(root,'settings/progress-backup.js')), {saveStatus}=require(path.join(root,'settings/save-status.js'));
const {buildForge,emptyForge}=require(path.join(root,'forge/forge-engine.js'));
const {buildVocabulary}=require(path.join(root,'learn/practice-engine.js'));
const cards=require('../src/assets/kanji-curriculum.json'),subjects=buildForge(cards),words=buildVocabulary(cards);
const empty=()=>({profile:null,kanji:{},vocabulary:{},forge:emptyForge()});
const progress=(attempts,due=100)=>({learned:true,stage:1,due,attempts});
const track=(reviews=1)=>({stage:2,due:100,reviews,correct:reviews,misses:0,updatedAt:200});
const record=()=>({meaning:track(),lessonAt:100,note:'A mnemonic',noteAt:100});
const parse=(value,legacy)=>b.parseBackup(JSON.stringify(value),cards,subjects,legacy);
let current=empty();current.kanji['一']=progress(5);current.vocabulary[words[0].id]=progress(4);
const radical=subjects.find(s=>s.kind==='radical').id;
current.forge.records[radical]=record();current.forge.meaningSynonyms[radical]={values:[],updatedAt:300};
current.profile={level:'N3',familiarity:'studying',updatedAt:300};
const incoming=empty();incoming.kanji['一']=progress(2);incoming.kanji['二']=progress(1);incoming.vocabulary[words[0].id]=progress(7);
incoming.forge.records[radical]={...record(),meaning:track(2),note:'Old note',noteAt:50};
incoming.forge.meaningSynonyms[radical]={values:['single line'],updatedAt:100};incoming.profile={level:'N5',familiarity:'studying',updatedAt:100};
const before=JSON.stringify(current), file=b.createBackup(incoming,100), parsed=parse(file), summary=b.summarizeImport(current,parsed);
assert.equal(JSON.stringify(current),before,'reading and previewing never change state');
assert.deepEqual(summary.rows[0],{label:'Kanji',added:1,updated:0,unchanged:1});assert.equal(summary.rows[1].updated,1);assert.equal(summary.rows[2].updated,1);assert.equal(summary.rows[3].unchanged,1);assert.equal(summary.profileChanged,false);
let merged=b.mergeBackup(current,parsed);assert.equal(merged.kanji['一'].attempts,5);assert.equal(merged.kanji['二'].attempts,1);assert.equal(merged.vocabulary[words[0].id].attempts,7);assert.equal(merged.forge.records[radical].note,'A mnemonic');assert.deepEqual(merged.forge.meaningSynonyms[radical].values,[]);assert.equal(merged.profile.level,'N3');
assert.equal(JSON.stringify(current),before);assert.deepEqual(b.mergeBackup(merged,parsed),merged,'repeated import is idempotent');
assert.deepEqual(b.mergeBackup(current,parse(b.createBackup(empty(),100))),current,'empty files never clear existing progress');
assert.deepEqual(parse(b.createBackup(current,100)).progress,current,'download round trip preserves all progress');
const download=b.createBackup({...current,revision:55,reviewEvents:['secret'],password:'secret'},100);assert.equal(JSON.stringify(download).includes('secret'),false);assert.equal('revision' in download.progress,false);
assert.throws(()=>parse({version:1,cards:{'一':progress(1)}}),/Choose whether/);
assert.equal(parse({version:1,cards:{'一':progress(1)}},'kanji').kind,'kanji');assert.equal(parse({version:1,cards:{[words[0].id]:progress(1)}},'vocabulary').kind,'vocabulary');assert.throws(()=>parse({version:1,cards:{'一':progress(1)}},'vocabulary'),/No matching/);
assert.equal(parse(current.forge).kind,'forge');
const unknown=b.createBackup(empty(),100);unknown.progress.kanji['unknown']=progress(1);unknown.progress.forge.meaningSynonyms['r:unknown']={values:['word'],updatedAt:100};
assert.equal(parse(unknown).skipped,2);assert.deepEqual(parse(unknown).progress.kanji,{});
for(const mutate of [
 f=>f.version=2,f=>f.exportedAt=-1,f=>delete f.progress.profile,f=>f.progress.profile={level:'N9',familiarity:'studying',updatedAt:1},
 f=>f.progress.kanji={'一':progress(1,1.5)},f=>f.progress.kanji={'一':progress(2147483648)},f=>f.progress.kanji={'一':progress(1,8640000000000001)},
 f=>f.progress.forge.records={[radical]:null},f=>f.progress.forge.records={[radical]:{...record(),meaning:{...track(),due:8640000000000001}}},
 f=>f.progress.forge.meaningSynonyms={[radical]:{values:['おお'],updatedAt:100}},f=>f.progress.forge.records={[radical]:{...record(),meaning:{...track(),reviews:2147483648,correct:2147483648}}}
]){const f=b.createBackup(empty(),100);mutate(f);assert.throws(()=>parse(f));}
assert.throws(()=>b.parseBackup('{broken',cards,subjects));assert.throws(()=>b.parseBackup(' '.repeat(32000001),cards,subjects),/32 MB/);
assert.throws(()=>parse({format:'other-app',version:1,cards:{}}));
const normalized=b.createBackup(empty(),100);normalized.progress.forge.records[radical]={...record(),extra:'discard',meaning:{...track(),extra:'discard'}};assert.equal(JSON.stringify(parse(normalized)).includes('discard'),false);
const base={ready:true,phase:'idle',connected:true,dirty:false,localSaved:true,pendingHistory:0,historyWarning:false,signedIn:true,demo:false,changing:false};
assert.equal(saveStatus(base).message,'Saved to your account');assert.equal(saveStatus({...base,signedIn:false}).message,'Progress saved');
assert.equal(saveStatus({...base,connected:false,dirty:true}).message,'Saved on this device');assert.equal(saveStatus({...base,connected:false,localSaved:false}).attention,true);
assert.equal(saveStatus({...base,connected:false,historyWarning:true}).attention,true,'a failed history copy must not claim a complete device save');
assert.equal(saveStatus({...base,connected:false,localSaved:false,phase:'saving'}).message,'Saving progress…');
assert.equal(saveStatus({...base,localSaved:false}).message,'Saved to your account','confirmed server save remains valid when device storage fails');
assert.equal(saveStatus({...base,connected:false,demo:true}).retry,false);assert.equal(saveStatus({...base,changing:true}).busy,true);assert.equal(saveStatus({...base,phase:'connecting'}).message,'Checking saved progress…');
console.log('PASS: account/device save states; unified and legacy files; read-only previews; merge summaries; stale data and tombstones; validation and size bounds; safe downloads; idempotent imports.');
