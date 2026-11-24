import { Injectable } from '@angular/core';
import { AccountService } from '../account/account.service';
import { StudySyncService } from '../learn/study-sync.service';
import { MemoryFilters, memoryMatches, savedMemories } from './memory-library';

const defaults = (): MemoryFilters => ({query:'',kind:'all',content:'all',sort:'recent'});
@Injectable({providedIn:'root'})
export class MemoryLibraryService {
  filters = defaults();
  limit = 20;
  returnItem = '';
  scrollY = 0;
  private owner?: string;
  constructor(private readonly sync: StudySyncService, private readonly account: AccountService) {}
  get ready(): boolean { return this.sync.ready && !this.account.changing; }
  reset(): void { this.filters=defaults();this.limit=20;this.returnItem='';this.scrollY=0;this.owner=undefined; }
  changed(): void { this.limit=20;this.returnItem='';this.scrollY=0; }
  clearFilters(): void { this.filters=defaults();this.changed(); }
  snapshot() {
    if (!this.ready) return null;
    if (this.owner!==this.account.account.id) { this.reset();this.owner=this.account.account.id; }
    const saved = savedMemories(this.sync.forgeSubjects,this.sync.state.value.forge);
    const matches = memoryMatches(saved,this.filters);
    return {total:saved.length,matched:matches.length,items:matches.slice(0,this.limit)};
  }
}
