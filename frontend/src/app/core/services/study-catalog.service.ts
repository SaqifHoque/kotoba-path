import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, shareReplay, tap } from 'rxjs';
import { KanjiCard, buildLevels } from '../../features/learn/kanji-engine';
import { applyCurriculum } from '../../features/learn/curriculum-manifest';
import { StudySyncService } from '../../features/learn/study-sync.service';

@Injectable({providedIn: 'root'})
export class StudyCatalogService {
  private readonly cards: Observable<KanjiCard[]>;
  constructor(http: HttpClient, sync: StudySyncService) {
    this.cards = forkJoin({
      cards: http.get<KanjiCard[]>('assets/kanji-curriculum.json'),
      manifest: http.get<unknown>('assets/curriculum-manifest.json')
    }).pipe(
      map(({cards, manifest}) => applyCurriculum(cards, manifest)),
      map(cards => { buildLevels(cards); return cards; }),
      tap(cards => sync.initialize(cards)),
      shareReplay({bufferSize: 1, refCount: false})
    );
  }
  load(): Observable<KanjiCard[]> { return this.cards; }
}
