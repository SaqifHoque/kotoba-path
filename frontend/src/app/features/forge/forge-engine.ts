import { KanjiCard, buildLevels } from '../learn/kanji-engine';
import { buildVocabulary, readingMatches } from '../learn/practice-engine';

export type Skill = 'meaning' | 'reading';
export interface Subject {
  id: string; kind: 'radical' | 'kanji' | 'vocabulary'; text: string; meaning: string;
  readings: string[]; prerequisites: string[]; level: number; image?: string; hint: string;
}
export interface Track { stage: number; due: number | null; reviews: number; correct: number; misses: number; updatedAt: number; }
export interface ForgeRecord { meaning: Track; reading?: Track; lessonAt: number; note: string; noteAt: number; }
export interface ForgeState { version: 1; records: Record<string, ForgeRecord>; unlockedLevel: number; dailyLimit: number; settingsAt: number; }
export interface Question { subject: Subject; skill: Skill; }
export const STAGES = ['Locked','Apprentice I','Apprentice II','Apprentice III','Apprentice IV','Guru I','Guru II','Master','Enlightened','Burned'];
export const WAITS = [0,4*3600000,8*3600000,86400000,2*86400000,7*86400000,14*86400000,30*86400000,120*86400000];
export const emptyForge = (): ForgeState => ({version:1,records:{},unlockedLevel:1,dailyLimit:10,settingsAt:0});
const RADICAL = (s: string) => `r:${s.normalize('NFKC')}`;
const STORIES: Record<string,string> = {
  '一':'One horizontal line: picture one path running straight across the page.',
  '人':'Picture a person standing with two legs apart. Tie the outline to “person.”',
  '山':'Picture three mountain peaks, with the tallest peak in the middle.',
  '川':'Picture three streams flowing side by side into a river.',
  '日':'Picture the sun inside a frame, with a horizon running across it.',
  '月':'Picture a narrow moon with two wisps of cloud inside it.',
  '木':'Picture a tree: a trunk through the middle with branches spreading out.',
  '休':'Picture a person resting beside a tree. This is a memory aid for “rest.”'
};
export function buildForge(cards: KanjiCard[]): Subject[] {
  const subjects: Subject[] = [], radicals = new Map<string,Subject>();
  const levels = new Map<string,number>();
  for (const level of buildLevels(cards)) for (const card of level.cards) levels.set(card.character,level.number);
  for (const card of cards) {
    const level = levels.get(card.character)!;
    const radical = RADICAL(card.radical);
    if (!radicals.has(radical)) radicals.set(radical,{id:radical,kind:'radical',text:card.radical.normalize('NFKC'),meaning:card.radicalMeaning,
      readings:[],prerequisites:[],level,image:card.radicalImage,
      hint:`Find this shape in ${cards.filter(c=>RADICAL(c.radical)===radical).slice(0,5).map(c=>c.character).join(' · ')}. Attach the label “${card.radicalMeaning}” to its outline. This is the catalog’s primary radical, not a complete decomposition.`});
    const readings = (card.onyomi || card.kunyomi).split(/[、,\/／]/).map(s=>s.trim()).filter(Boolean);
    subjects.push({id:`k:${card.character}`,kind:'kanji',text:card.character,meaning:card.meaning,readings,prerequisites:[radical],level,
      hint:STORIES[card.character] || `Memory link: find the “${card.radicalMeaning}” radical in ${card.character}. Invent a scene joining that shape to “${card.meaning}”, then say ${readings[0] || ''}. This is a mnemonic prompt, not an etymology.`});
  }
  for (const word of buildVocabulary(cards)) {
    // Every prerequisite must have a lesson in this independent curriculum.
    if (!word.prerequisites.length || word.prerequisites.some(k=>!levels.has(k))) continue;
    subjects.push({id:`v:${word.id}`,kind:'vocabulary',text:word.text,meaning:word.meaning,readings:word.reading.split(/[/／、]/),
      prerequisites:word.prerequisites.map(k=>`k:${k}`),level:Math.max(...word.prerequisites.map(k=>levels.get(k)!)),
      hint:word.context ? `${word.context[0]} — ${word.context[1]}` : `Read ${word.text} as a whole word: ${word.reading}. Link its meaning, “${word.meaning}”, to a situation you can picture.`});
  }
  return [...radicals.values(),...subjects].sort((a,b)=>a.level-b.level || ['radical','kanji','vocabulary'].indexOf(a.kind)-['radical','kanji','vocabulary'].indexOf(b.kind));
}
export function skills(subject: Subject): Skill[] { return subject.readings.length ? ['meaning','reading'] : ['meaning']; }
export function mastery(record?: ForgeRecord): number { return record ? Math.min(record.meaning.stage,record.reading?.stage ?? 9) : 0; }
export function canLearn(subject: Subject, state: ForgeState): boolean {
  return !state.records[subject.id] && subject.level<=state.unlockedLevel && subject.prerequisites.every(id=>mastery(state.records[id])>=5);
}
export function dueQuestions(subjects: Subject[], state: ForgeState, now: number): Question[] {
  return subjects.flatMap(subject=>skills(subject).filter(skill=>{
    const track=state.records[subject.id]?.[skill];return track && track.stage<9 && track.due!==null && track.due<=now;
  }).map(skill=>({subject,skill}))).sort((a,b)=>state.records[a.subject.id][a.skill]!.due!-state.records[b.subject.id][b.skill]!.due!);
}
export function lessonAllowance(subjects: Subject[], state: ForgeState, now: number): number {
  const today=new Date(now).toDateString();
  const introduced=Object.values(state.records).filter(r=>new Date(r.lessonAt).toDateString()===today).length;
  const apprentice=Object.values(state.records).filter(r=>mastery(r)<5).length;
  if(dueQuestions(subjects,state,now).length>=20)return 0;
  return Math.max(0,Math.min(state.dailyLimit-introduced,50-apprentice));
}
function firstTrack(now: number): Track { return {stage:1,due:now+WAITS[1],reviews:0,correct:0,misses:0,updatedAt:now}; }
export function learn(subject: Subject, subjects: Subject[], state: ForgeState, now: number): ForgeState {
  if(!canLearn(subject,state)||!lessonAllowance(subjects,state,now))return state;
  return {...state,records:{...state.records,[subject.id]:{meaning:firstTrack(now),...(subject.readings.length?{reading:firstTrack(now)}:{}),lessonAt:now,note:'',noteAt:0}}};
}
export function review(subject: Subject, skill: Skill, correct: boolean, subjects: Subject[], state: ForgeState, now: number): ForgeState {
  const record=state.records[subject.id],track=record?.[skill];
  if(!track || track.stage===9 || track.due===null || track.due>now)return state;
  const stage=correct?Math.min(9,track.stage+1):Math.max(1,track.stage-(track.stage>=5?2:1));
  const next={...track,stage,due:stage===9?null:now+WAITS[stage],reviews:track.reviews+1,correct:track.correct+Number(correct),misses:track.misses+Number(!correct),updatedAt:now};
  const updated={...state,records:{...state.records,[subject.id]:{...record,[skill]:next}}};
  const maxLevel=Math.max(...subjects.map(s=>s.level));
  while(updated.unlockedLevel<maxLevel){
    const kanji=subjects.filter(s=>s.kind==='kanji'&&s.level===updated.unlockedLevel);
    if(!kanji.length||kanji.filter(s=>mastery(updated.records[s.id])>=5).length<Math.ceil(kanji.length*.9))break;
    updated.unlockedLevel++;
  }
  return updated;
}
export function accepts(subject: Subject, skill: Skill, answer: string): boolean {
  if(skill==='reading')return subject.readings.some(r=>readingMatches(answer,r));
  const normalize=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/\[[^\]]*\]|\([^)]*\)/g,'').replace(/^to\s+/,'').replace(/[^a-z0-9 ]/g,' ').trim().replace(/\s+/g,' ');
  const input=normalize(answer);return !!input && subject.meaning.split(/[,;/]/).some(m=>normalize(m)===input);
}
export function weakSubjects(subjects: Subject[], state: ForgeState): Subject[] {
  return subjects.filter(s=>skills(s).some(skill=>{const t=state.records[s.id]?.[skill];return t && t.misses>=3 && t.correct/Math.max(1,t.reviews)<.8;}));
}
const CONFUSIONS=['日目白','土士','未末','人入','大犬太','持待','晴清情','買売','右石','千干','牛午'];
export function contrasts(subject: Subject, subjects: Subject[]): Subject[] {
  const group=CONFUSIONS.find(g=>g.includes(subject.text));
  return group?subjects.filter(s=>s.kind==='kanji'&&s.text!==subject.text&&group.includes(s.text)):[];
}
export function parseForge(value: unknown, subjects: Subject[]): ForgeState {
  if(value===null || value===undefined)return emptyForge();
  const s=value as ForgeState;
  if(s.version!==1||!s.records||Array.isArray(s.records)||typeof s.records!=='object'||!Number.isInteger(s.unlockedLevel)||s.unlockedLevel<1||s.unlockedLevel>103||![5,10,20].includes(s.dailyLimit)||!Number.isSafeInteger(s.settingsAt)||s.settingsAt<0)throw new Error('Invalid Forge progress');
  const records: ForgeState['records']={};
  for(const subject of subjects){
    const r=s.records[subject.id];if(!r)continue;
    if(!Number.isSafeInteger(r.lessonAt)||r.lessonAt<0||typeof r.note!=='string'||r.note.length>1000||!Number.isSafeInteger(r.noteAt)||r.noteAt<0)throw new Error('Invalid Forge record');
    for(const skill of skills(subject)){
      const t=r[skill];
      if(!t||!Number.isInteger(t.stage)||t.stage<1||t.stage>9||!Number.isSafeInteger(t.updatedAt)||t.updatedAt<0||
        !Number.isInteger(t.reviews)||t.reviews<0||!Number.isInteger(t.correct)||t.correct<0||!Number.isInteger(t.misses)||t.misses<0||t.correct+t.misses!==t.reviews||
        (t.stage===9?t.due!==null:!Number.isSafeInteger(t.due)||t.due!<0))throw new Error('Invalid Forge track');
    }
    records[subject.id]=r;
  }
  return {...s,records};
}
export function mergeForge(a: ForgeState,b: ForgeState): ForgeState {
  const records={...a.records};
  for(const [id,r] of Object.entries(b.records)){
    const old=records[id];if(!old){records[id]=r;continue;}
    const newest=(x:Track|undefined,y:Track|undefined)=>!x?y:!y?x:y.reviews>x.reviews||(y.reviews===x.reviews&&y.updatedAt>x.updatedAt)?y:x;
    const notes=r.noteAt>old.noteAt?r:old;
    records[id]={meaning:newest(old.meaning,r.meaning)!,...(old.reading||r.reading?{reading:newest(old.reading,r.reading)}:{}),lessonAt:Math.min(old.lessonAt,r.lessonAt),note:notes.note,noteAt:notes.noteAt};
  }
  return {...(b.settingsAt>a.settingsAt?b:a),records,unlockedLevel:Math.max(a.unlockedLevel,b.unlockedLevel)};
}
