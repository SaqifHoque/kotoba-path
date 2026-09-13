import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { KanjiCard } from '../learn/kanji-engine';
import { StudySyncService } from '../learn/study-sync.service';
import { Subject, Skill, Question, ForgeState, STAGES, accepts, canLearn, contrasts, dueQuestions, emptyForge, learn, lessonAllowance, mastery, mergeForge, parseForge, review, skills, weakSubjects } from './forge-engine';

@Component({selector:'app-forge',standalone:true,imports:[CommonModule,FormsModule],templateUrl:'./forge.component.html',styleUrls:['./forge.component.scss']})
export class ForgeComponent implements OnInit, OnDestroy {
  subjects:Subject[]=[]; state:ForgeState=emptyForge(); loading=true; error=''; message=''; now=Date.now();
  mode:'dashboard'|'lesson'|'review'|'practice'='dashboard'; queue:Question[]=[]; study=false; checked=false; correct=false; answer=''; note='';
  stageNames=STAGES; selectedKind:'all'|'radical'|'kanji'|'vocabulary'='all'; page=1;
  private subscription?:Subscription; private loadingSubscription?:Subscription; private timer?:ReturnType<typeof setInterval>;
  private destroyed=false;
  constructor(private http:HttpClient,public sync:StudySyncService){}
  ngOnInit():void{this.load();this.timer=setInterval(()=>this.now=Date.now(),10000);}
  load():void{
    this.loading=true;this.error='';
    this.loadingSubscription?.unsubscribe();
    this.loadingSubscription=this.http.get<KanjiCard[]>('assets/kanji-curriculum.json').subscribe({next:async cards=>{
      await this.sync.initialize(cards);if(this.destroyed)return;this.subjects=this.sync.forgeSubjects;
      this.subscription?.unsubscribe();this.subscription=this.sync.state.subscribe(s=>{this.state=s.forge;});
      this.page=this.state.unlockedLevel;this.loading=false;
    },error:()=>{this.error='Kanji Forge could not load its lessons. Please retry.';this.loading=false;}});
  }
  get current():Question|undefined{return this.queue[0];}
  get due():Question[]{return dueQuestions(this.subjects,this.state,this.now);}
  get allowance():number{return lessonAllowance(this.subjects,this.state,this.now);}
  get lessons():Subject[]{return this.subjects.filter(s=>canLearn(s,this.state));}
  get weak():Subject[]{return weakSubjects(this.subjects,this.state);}
  get introduced():number{return Object.keys(this.state.records).length;}
  get tracks(){return Object.values(this.state.records).flatMap(r=>r.reading?[r.meaning,r.reading]:[r.meaning]);}
  get accuracy():number{const t=this.tracks;return Math.round(100*t.reduce((a,r)=>a+r.correct,0)/Math.max(1,t.reduce((a,r)=>a+r.reviews,0)));}
  get xp():number{return this.introduced*5+this.tracks.reduce((a,r)=>a+r.correct*10,0);}
  get nextDue():number|undefined{const due=this.tracks.filter(t=>t.due!==null&&t.due>this.now).map(t=>t.due!);return due.length?Math.min(...due):undefined;}
  get levelKanji():Subject[]{return this.subjects.filter(s=>s.kind==='kanji'&&s.level===this.state.unlockedLevel);}
  get guruCount():number{return this.levelKanji.filter(s=>mastery(this.state.records[s.id])>=5).length;}
  get needed():number{return Math.ceil(this.levelKanji.length*.9);}
  get library():Subject[]{return this.subjects.filter(s=>s.level===this.page&&(this.selectedKind==='all'||s.kind===this.selectedKind));}
  get comparisons():Subject[]{return this.current?contrasts(this.current.subject,this.subjects):[];}
  get accepted():string{const q=this.current;return !q?'':q.skill==='meaning'?q.subject.meaning:q.subject.readings.join(' / ');}
  mastery(s:Subject):number{return mastery(this.state.records[s.id]);}
  status(s:Subject):string{return this.state.records[s.id]?STAGES[this.mastery(s)]:canLearn(s,this.state)?'Ready for lesson':'Locked';}
  countStage(from:number,to:number):number{return Object.values(this.state.records).filter(r=>mastery(r)>=from&&mastery(r)<=to).length;}
  subjectName(id:string):string{return this.subjects.find(s=>s.id===id)?.text||id;}
  blockedBy(s:Subject):string{return s.level>this.state.unlockedLevel?`Reach Forge level ${s.level}`:s.prerequisites.filter(id=>mastery(this.state.records[id])<5).map(id=>this.subjectName(id)+' → Guru').join(', ');}
  private persist(next:ForgeState):void{this.state=next;this.sync.updateForge(next);}
  setLimit(value:string):void{const limit=Number(value);if([5,10,20].includes(limit))this.persist({...this.state,dailyLimit:limit,settingsAt:Date.now()});}
  startLessons():void{
    this.now=Date.now();const lessons=this.lessons.slice(0,Math.min(5,this.allowance));
    if(!lessons.length)return;
    this.message='';this.mode='lesson';this.queue=lessons.flatMap(subject=>skills(subject).map(skill=>({subject,skill})));this.reset();this.study=true;
  }
  startReviews():void{this.now=Date.now();this.queue=this.due.slice(0,40);if(this.queue.length){this.mode='review';this.reset();this.study=false;}}
  practice(items:Subject[]):void{
    const allowed=items.filter(s=>!!this.state.records[s.id]);if(!allowed.length)return;
    this.queue=allowed.slice(0,10).flatMap(subject=>skills(subject).map(skill=>({subject,skill})));this.mode='practice';this.study=false;this.reset();
  }
  practiceConfusions():void{this.practice(this.subjects.filter(s=>s.kind==='kanji'&&contrasts(s,this.subjects).length>0));}
  get hasConfusions():boolean{return this.subjects.some(s=>s.kind==='kanji'&&this.state.records[s.id]&&contrasts(s,this.subjects).length>0);}
  check():void{if(!this.current||this.checked)return;this.correct=accepts(this.current.subject,this.current.skill,this.answer);this.checked=true;}
  continue():void{
    const q=this.current;if(!q||!this.checked)return;
    if(this.mode==='lesson'&&!this.correct){this.answer='';this.checked=false;return;}
    this.now=Date.now();
    if(this.mode==='review')this.persist(review(q.subject,q.skill,this.correct,this.subjects,this.state,this.now));
    const finishedSubject=this.queue[1]?.subject.id!==q.subject.id;
    if(this.mode==='lesson'&&finishedSubject){
      const next=learn(q.subject,this.subjects,this.state,this.now);
      if(next!==this.state)this.persist({...next,records:{...next.records,[q.subject.id]:{...next.records[q.subject.id],note:this.note.trim().slice(0,1000),noteAt:this.now}}});
      else this.message='The lesson limit or prerequisites changed. This item was not introduced; return later.';
    }
    this.queue=this.queue.slice(1);this.reset(finishedSubject);this.study=this.mode==='lesson'&&finishedSubject;
    if(!this.queue.length){this.message=this.mode==='practice'?'Practice complete. Mastery, XP, and review dates are unchanged.':this.message||'Session complete. Your scheduled reviews build lasting mastery.';this.mode='dashboard';}
  }
  private reset(resetNote=true):void{this.answer='';this.checked=false;this.correct=false;if(resetNote&&this.current)this.note=this.state.records[this.current.subject.id]?.note||'';}
  leave():void{this.mode='dashboard';this.queue=[];this.message='Completed reviews are saved. Unfinished lesson checks do not introduce an item.';}
  saveNote():void{const q=this.current;if(!q||!this.state.records[q.subject.id])return;this.persist({...this.state,records:{...this.state.records,[q.subject.id]:{...this.state.records[q.subject.id],note:this.note.trim().slice(0,1000),noteAt:Date.now()}}});this.message='Mnemonic saved.';}
  export():void{const url=URL.createObjectURL(new Blob([JSON.stringify(this.state)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='kanji-forge-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  async restore(event:Event):Promise<void>{const input=event.target as HTMLInputElement,file=input.files?.[0];if(!file)return;try{if(file.size>8000000)throw new Error('Too large');this.persist(mergeForge(this.state,parseForge(JSON.parse(await file.text()),this.subjects)));this.mode='dashboard';this.queue=[];this.message='Forge backup merged. Existing progress is preserved.';}catch{this.message='Invalid Forge backup. Your progress was not changed.';}input.value='';}
  ngOnDestroy():void{this.destroyed=true;this.subscription?.unsubscribe();this.loadingSubscription?.unsubscribe();if(this.timer)clearInterval(this.timer);}
}
