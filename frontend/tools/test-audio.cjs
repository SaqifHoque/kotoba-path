const assert=require('node:assert/strict'),path=require('node:path');
const root=process.argv[2],{audioWord,japaneseVoice}=require(path.join(root,'audio/word-audio.js')),{AudioPlayer}=require(path.join(root,'audio/audio-player.js'));
const {STARTER_CHAPTER}=require(path.join(root,'chapters/starter-chapter.js')),{buildForge}=require(path.join(root,'forge/forge-engine.js'));
const english={voiceURI:'en',name:'Japanese sounding name',lang:'en-US',localService:true,default:true};
const ja={voiceURI:'ja-local',name:'Japanese',lang:'ja-JP',localService:true,default:false},remote={...ja,voiceURI:'ja-remote',localService:false,default:true};
assert.equal(japaneseVoice([english]),null);assert.equal(japaneseVoice([remote,english,ja]),ja);assert.equal(japaneseVoice([remote]),remote);
assert.equal(japaneseVoice([{...ja,lang:'ja_JP'}]).lang,'ja_JP');assert.equal(japaneseVoice([{...english,lang:'javanese'}]),null);
const word=audioWord('v:人:ひと','人',['ヒト','ひと','japanese','人','ひと / にん']);assert.deepEqual(word.readings,['ひと','にん']);
assert.equal(audioWord('v:bad','word','English'),null);assert.equal(audioWord('v:bad','word','人'),null);assert.equal(audioWord('v:bad','word','あ'.repeat(101)),null);assert.equal(audioWord('','人','ひと'),null);
assert.deepEqual(audioWord('v:test','テスト','ﾃｽﾄ').readings,['てすと']);
for(const item of STARTER_CHAPTER.words)assert(audioWord(item.id,item.text,item.reading),item.text);
const subjects=buildForge(require('../src/assets/kanji-curriculum.json')),before=JSON.stringify(subjects);
let supportedWords=0;
for(const subject of subjects.filter(s=>s.kind==='vocabulary')){const target=audioWord(subject.id,subject.text,subject.readings);if(target){supportedWords++;assert(target.readings.every(reading=>/^[\p{Script=Hiragana}\p{Script=Katakana}ーゝゞ]+$/u.test(reading)))}}
assert.equal(JSON.stringify(subjects),before);
function rig(initialVoices=[ja],supported=true){
 const r={voices:initialVoices,requests:[],cancelled:0,timers:new Map(),states:[],counter:0,throwSpeak:false,throwVoices:false,throwCancel:false};
 r.player=new AudioPlayer({supported,voices:()=>{if(r.throwVoices)throw Error('voices');return r.voices},
 speak:(request,callbacks)=>{if(r.throwSpeak)throw Error('speak');r.requests.push({request,callbacks})},
 cancel:()=>{r.cancelled++;r.requests.at(-1)?.callbacks.error();if(r.throwCancel)throw Error('cancel')},
 later:(callback,delay)=>{const key=++r.counter;r.timers.set(key,{callback,delay});return()=>r.timers.delete(key)}},state=>{r.state=state;r.states.push(state)});
 return r;
}
let r=rig([]);assert.equal(r.state.available,false);assert.equal(r.requests.length,0);r.player.play('a',word,'ひと',1);assert.equal(r.state.phase,'error');assert.equal(r.requests.length,0);
r.voices=[ja];r.player.refresh();assert.equal(r.state.available,true);assert.equal(r.state.phase,'idle','discovering a Japanese voice clears the obsolete unavailable error');assert.equal(r.requests.length,0,'voice discovery never autoplays');
r.player.play('a',word,'ひと',1);assert.equal(r.state.phase,'starting');assert.equal(r.requests[0].request.text,'ひと');assert.equal(r.requests[0].request.voice.voiceURI,ja.voiceURI);assert.equal(r.requests[0].request.rate,1);assert.equal([...r.timers.values()][0].delay,15000);
r.requests[0].callbacks.start();assert.equal(r.state.phase,'speaking');assert.equal([...r.timers.values()][0].delay,30000);r.requests[0].callbacks.end();assert.equal(r.state.phase,'idle');assert.equal(r.timers.size,0);
r.player.play('a',word,'ひと',1);const stale=r.requests.at(-1).callbacks;r.player.play('b',word,'にん',0.75);assert.equal(r.cancelled,1);assert.equal(r.requests.at(-1).request.rate,0.75);assert.equal(r.state.owner,'b');
stale.start();stale.end();stale.error();assert.equal(r.state.owner,'b');assert.equal(r.state.phase,'starting');
r.player.stop('a');assert.equal(r.cancelled,1,'unmounting a different control must not stop the current word');r.player.stop('b');assert.equal(r.cancelled,2);assert.equal(r.state.owner,null);assert.equal(r.timers.size,0);
r.player.play('a',word,'ひと',1);const count=r.requests.length;r.player.play('b',word,'English',1);r.player.play('b',word,'ひと',0.5);assert.equal(r.requests.length,count);assert.equal(r.state.owner,'a');
r.voices=[english];r.player.refresh();assert.equal(r.state.available,false);assert.equal(r.state.phase,'idle');assert.equal(r.cancelled,3);
r=rig();r.player.play('a',word,'ひと',1);[...r.timers.values()][0].callback();assert.equal(r.state.phase,'error');assert.equal(r.cancelled,1);assert.equal(r.timers.size,0);r.player.play('a',word,'ひと',1);r.requests.at(-1).callbacks.start();[...r.timers.values()][0].callback();assert.equal(r.state.phase,'error');assert.equal(r.cancelled,2);
r=rig();r.throwSpeak=true;r.player.play('a',word,'ひと',1);assert.equal(r.state.phase,'error');assert.equal(r.timers.size,0);r.throwSpeak=false;r.player.play('a',word,'ひと',1);assert.equal(r.state.phase,'starting');r.throwCancel=true;r.player.stop();assert.equal(r.state.phase,'idle');
r=rig();r.throwVoices=true;assert.doesNotThrow(()=>r.player.refresh());assert.equal(r.state.available,false);
r=rig([],false);r.player.play('a',word,'ひと',1);assert.equal(r.state.supported,false);assert.equal(r.state.phase,'error');assert.equal(r.requests.length,0);
console.log(`PASS: ${supportedWords} catalog word targets; Japanese-only/local-preferred voices; whole-word kana and speed; delayed voice recovery; no autoplay; replacement/ownership; stale callbacks; voice loss; timeout/error recovery; unchanged catalog.`);
