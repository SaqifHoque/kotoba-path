import { Injectable } from '@angular/core';
import { AccountService } from '../account/account.service';
import { StudySyncService } from '../learn/study-sync.service';
import { ForgeState, Subject } from '../forge/forge-engine';
import { TroubleSpot, defaultTroubleFilters, filterTroubleSpots, troublePracticeQuestions, troubleSpots } from './trouble-spots';

@Injectable({providedIn:'root'})
export class TroubleSpotsService {
  filters = defaultTroubleFilters();
  limit = 20;
  returnItem = '';
  scrollY = 0;
  private owner?: string;
  private cached?: {forge:ForgeState;subjects:Subject[];key:string;total:number;matched: TroubleSpot[]};
  constructor(private readonly sync: StudySyncService, private readonly account: AccountService) {}
  get ready(): boolean { return this.sync.ready&&!this.account.changing; }
  reset(): void {
    this.filters=defaultTroubleFilters();this.limit=20;this.returnItem='';this.scrollY=0;
    this.owner=undefined;this.cached=undefined;
  }
  changed(): void { this.limit=20;this.returnItem='';this.scrollY=0; }
  clearFilters(): void { this.filters=defaultTroubleFilters();this.changed(); }
  snapshot(now = Date.now()) {
    if (!this.ready) return null;
    if (this.owner!==this.account.account.id) { this.reset();this.owner=this.account.account.id; }
    const forge=this.sync.state.value.forge, subjects=this.sync.forgeSubjects;
    const key=JSON.stringify([this.filters,Math.floor(now/10000)]);
    if (!this.cached || this.cached.forge!==forge || this.cached.subjects!==subjects || this.cached.key!==key) {
      const all=troubleSpots(subjects,forge,now);
      this.cached={forge,subjects,key,total:all.length,matched:filterTroubleSpots(all,this.filters)};
    }
    return {total:this.cached.total,matched:this.cached.matched.length,items:this.cached.matched.slice(0,this.limit),
      questions:troublePracticeQuestions(this.cached.matched)};
  }
}
