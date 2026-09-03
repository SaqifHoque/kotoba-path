import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CatalogPage, KanjiDetail, RadicalDetail, ReadingToken } from '../models/catalog.models';

@Injectable({providedIn:'root'})
export class CatalogService {
  private readonly base='/api/encyclopedia';
  constructor(private readonly http:HttpClient){}
  search(query='',jlpt='',page=0):Observable<CatalogPage>{const params=new HttpParams().set('query',query).set('jlpt',jlpt).set('page',page).set('size',24);return this.http.get<CatalogPage>(`${this.base}/kanji`,{params});}
  kanji(character:string):Observable<KanjiDetail>{return this.http.get<KanjiDetail>(`${this.base}/kanji/${encodeURIComponent(character)}`);}
  radical(character:string):Observable<RadicalDetail>{return this.http.get<RadicalDetail>(`${this.base}/radicals/${encodeURIComponent(character)}`);}
  analyze(text:string):Observable<ReadingToken[]>{return this.http.post<ReadingToken[]>(`${this.base}/reader/analyze`,{text});}
}
