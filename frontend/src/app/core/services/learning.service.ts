import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of, tap } from 'rxjs';
import { LearningPath } from '../models/learning.models';
import { DEMO_LESSONS } from './demo-curriculum';

@Injectable({providedIn:'root'})
export class LearningService {
  private readonly base = '/api';
  private readonly learner = 'local-learner';
  private readonly key = 'kotoba-path-progress';
  private serverAvailable = true;
  constructor(private readonly http: HttpClient) {}

  loadPath(): Observable<LearningPath> {
    return this.http.get<LearningPath>(`${this.base}/learners/${this.learner}/path`).pipe(
      tap(() => this.serverAvailable = true),
      catchError(() => { this.serverAvailable = false; return of(this.localPath()); })
    );
  }
  complete(lessonId: string): Observable<LearningPath> {
    if (!this.serverAvailable) return of(this.completeLocally(lessonId));
    return this.http.post<LearningPath>(`${this.base}/learners/${this.learner}/lessons/${lessonId}/complete`, {}).pipe(
      catchError(() => { this.serverAvailable = false; return of(this.completeLocally(lessonId)); })
    );
  }
  private localPath(): LearningPath {
    const completedLessonIds: string[] = JSON.parse(localStorage.getItem(this.key) ?? '[]');
    return {lessons: DEMO_LESSONS, progress:{learnerId:this.learner,completedLessonIds}, nextLessonId: DEMO_LESSONS.find(x => !completedLessonIds.includes(x.id))?.id ?? null};
  }
  private completeLocally(id: string): LearningPath {
    const path = this.localPath();
    if (!path.progress.completedLessonIds.includes(id)) path.progress.completedLessonIds.push(id);
    localStorage.setItem(this.key, JSON.stringify(path.progress.completedLessonIds));
    return this.localPath();
  }
}
