import { Injectable } from '@angular/core';
import { AccountService } from '../account/account.service';
import { StudySyncService } from '../learn/study-sync.service';
import { Subject } from '../forge/forge-engine';
import { KanjiComparisonIndex, buildKanjiComparisonIndex, kanjiComparison } from './kanji-comparison';

@Injectable({providedIn:'root'})
export class KanjiComparisonService {
  leftId='';
  rightId='';
  returnItem='';
  scrollY=0;
  error='';
  private owner?: string;
  private subjects?: Subject[];
  private index?: KanjiComparisonIndex;
  constructor(private readonly sync: StudySyncService, private readonly account: AccountService) {}
  get ready(): boolean { return this.sync.ready&&!this.account.changing; }
  reset(): void { this.leftId='';this.rightId='';this.returnItem='';this.scrollY=0;this.owner=undefined;this.error=''; }
  private prepare(): boolean {
    if (!this.ready) return false;
    if (this.owner!==this.account.account.id) { this.reset();this.owner=this.account.account.id; }
    if (this.subjects!==this.sync.forgeSubjects) {
      this.subjects=this.sync.forgeSubjects;this.index=undefined;this.error='';
      try { this.index=buildKanjiComparisonIndex(this.subjects); }
      catch { this.error='Kanji comparisons could not be loaded. Your saved progress is unchanged.'; }
    }
    return !!this.index;
  }
  canCompare(id: string): boolean { return this.prepare()&&!!this.index!.peers.get(id)?.length; }
  open(id?: string): boolean {
    if (!this.prepare()) return false;
    const left=id??(this.index!.peers.has(this.leftId)?this.leftId:this.index!.candidates[0]?.id);
    if (!left) return false;
    return this.chooseLeft(left);
  }
  chooseLeft(id: string): boolean {
    if (!this.prepare()) return false;
    const peers=this.index!.peers.get(id);
    if (!peers?.length) return false;
    this.leftId=id;
    if (!peers.some(s=>s.id===this.rightId)) this.rightId=peers[0].id;
    this.returnItem='';this.scrollY=0;
    return true;
  }
  chooseRight(id: string): void {
    if (!this.prepare()||!this.index!.peers.get(this.leftId)?.some(s=>s.id===id)) return;
    this.rightId=id;this.returnItem='';this.scrollY=0;
  }
  snapshot() {
    if (!this.prepare()) return null;
    if (!this.index!.peers.has(this.leftId)) this.open();
    else if (!this.index!.peers.get(this.leftId)!.some(s=>s.id===this.rightId)) this.chooseLeft(this.leftId);
    const pair=kanjiComparison(this.index!,this.leftId,this.rightId,this.sync.state.value.forge);
    return {candidates:this.index!.candidates,peers:this.index!.peers.get(this.leftId)??[],pair};
  }
}
