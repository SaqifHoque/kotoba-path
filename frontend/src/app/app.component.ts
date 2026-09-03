import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { LearningService } from './core/services/learning.service';
import { LearningPath, Lesson } from './core/models/learning.models';
import { LessonCardComponent } from './features/learn/lesson-card.component';
import { ProgressRingComponent } from './shared/progress-ring/progress-ring.component';
import { EncyclopediaComponent } from './features/encyclopedia/encyclopedia.component';

@Component({selector:'app-root',standalone:true,imports:[NgFor,NgIf,LessonCardComponent,ProgressRingComponent,EncyclopediaComponent],templateUrl:'./app.component.html',styleUrls:['./app.component.scss']})
export class AppComponent implements OnInit {
  path?: LearningPath; active?: Lesson; loading=true; menuOpen=false; view:'learn'|'catalog'='learn';
  constructor(private readonly learning: LearningService) {}
  ngOnInit(): void { this.learning.loadPath().subscribe(path => {this.apply(path);this.loading=false;}); }
  get completed(): number { return this.path?.progress.completedLessonIds.length ?? 0; }
  get percentage(): number { return this.path ? Math.round(this.completed / this.path.lessons.length * 100) : 0; }
  isDone(id:string):boolean { return this.path?.progress.completedLessonIds.includes(id) ?? false; }
  isLocked(lesson:Lesson):boolean { return !this.isDone(lesson.id) && this.path?.nextLessonId !== lesson.id; }
  select(lesson:Lesson):void { if(!this.isLocked(lesson)) {this.active=lesson;this.menuOpen=false;} }
  complete(id:string):void { this.learning.complete(id).subscribe(path=>this.apply(path)); }
  private apply(path:LearningPath):void { this.path=path;this.active=path.lessons.find(x=>x.id===path.nextLessonId) ?? path.lessons[path.lessons.length-1]; }
}
