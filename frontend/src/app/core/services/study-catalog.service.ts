import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay, tap } from 'rxjs';
import { KanjiCard, buildLevels } from '../../features/learn/kanji-engine';
import { StudySyncService } from '../../features/learn/study-sync.service';

@Injectable({providedIn: 'root'})
export class StudyCatalogService {
  private readonly cards: Observable<KanjiCard[]>;
  constructor(http: HttpClient, sync: StudySyncService) {
    this.cards = http.get<KanjiCard[]>('assets/kanji-curriculum.json').pipe(
      map(cards => { buildLevels(cards); return cards; }),
      tap(cards => sync.initialize(cards)),
      shareReplay({bufferSize: 1, refCount: false})
    );
  }
  load(): Observable<KanjiCard[]> { return this.cards; }
}
