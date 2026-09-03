import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { Lesson } from '../../core/models/learning.models';

@Component({selector:'app-lesson-card',standalone:true,imports:[NgFor,NgIf],template:`
  <article class="lesson-card">
    <header><div><span class="eyebrow">{{typeLabel}}</span><h2>{{lesson.title}}</h2></div><span class="counter">{{lesson.order}} / {{total}}</span></header>
    <div class="character" [class.long]="lesson.type === 'SENTENCE' || lesson.type === 'PASSAGE'">{{lesson.japanese}}</div>
    <button class="reading-toggle" type="button" (click)="showReading=!showReading">{{showReading ? 'Hide' : 'Show'}} reading <span>⌄</span></button>
    <div class="reading" *ngIf="showReading"><span>{{lesson.reading}}</span><strong>{{lesson.meaning}}</strong></div>
    <div class="explanation"><span class="spark">✦</span><p>{{lesson.explanation}}</p></div>
    <section class="radicals" *ngIf="lesson.radicals.length"><div class="section-title"><span>Building blocks</span><i></i><small>{{lesson.radicals.length}} parts</small></div>
      <div class="radical-grid"><div class="radical" *ngFor="let radical of lesson.radicals"><b>{{radical.character}}</b><div><strong>{{radical.meaning}}</strong><p>{{radical.mnemonic}}</p></div></div></div>
    </section>
    <footer><button class="complete" type="button" (click)="completed.emit(lesson.id)">I understand <span>→</span></button><span>Complete to unlock the next lesson</span></footer>
  </article>
`,styleUrls:['./lesson-card.component.scss']})
export class LessonCardComponent {
  @Input({required:true}) lesson!: Lesson; @Input() total=0; @Output() completed = new EventEmitter<string>();
  showReading=false;
  get typeLabel(): string { return ({RADICAL:'Foundation · Radical',KANJI:'Foundation · Kanji',SENTENCE:'Reading · Sentence',PASSAGE:'Reading · Passage'})[this.lesson.type]; }
}
