import { Injectable } from '@angular/core';
import { AccountService } from '../account/account.service';
import { StudySyncService } from '../learn/study-sync.service';
import { MemoryConflict, MemorySnapshot, memorySnapshot, savePersonalMemory } from './personal-memory';

export interface MemoryDraft {
  baseline: MemorySnapshot;
  note: string;
  synonyms: string;
  message: string;
  conflict: boolean;
}
@Injectable({providedIn:'root'})
export class PersonalMemoryService {
  private owner?: string;
  private drafts = new Map<string,MemoryDraft>();
  constructor(private readonly sync: StudySyncService, private readonly account: AccountService) {}
  get ready(): boolean { return this.sync.ready && !this.account.changing; }
  private checkOwner(): void {
    if (this.owner !== this.account.account.id) { this.drafts.clear(); this.owner = this.account.account.id; }
  }
  draft(id: string): MemoryDraft | undefined {
    if (!this.ready) return undefined;
    this.checkOwner(); return this.drafts.get(id);
  }
  get hasUnsaved(): boolean {
    return this.ready && this.owner === this.account.account.id && [...this.drafts.values()].some(d=>this.dirty(d));
  }
  dirty(draft: MemoryDraft): boolean {
    return draft.note !== draft.baseline.note || draft.synonyms !== draft.baseline.values.join('\n');
  }
  introduced(id: string): boolean { return this.ready && !!this.sync.state.value.forge.records[id]; }
  open(id: string): void {
    if (!this.ready || !this.sync.forgeSubjects.some(s=>s.id===id)) return;
    this.checkOwner();
    if (this.drafts.has(id)) return;
    const baseline = memorySnapshot(this.sync.state.value.forge,id);
    this.drafts.set(id,{baseline,note:baseline.note,synonyms:baseline.values.join('\n'),message:'',conflict:false});
  }
  cancel(id: string): void { if (this.ready) { this.checkOwner(); this.drafts.delete(id); } }
  reload(id: string): void { this.cancel(id); this.open(id); }
  clear(): void { this.drafts.clear(); this.owner = undefined; }
  save(draft: MemoryDraft): void {
    if (!this.ready) return;
    this.checkOwner();
    const id = draft.baseline.subjectId;
    if (this.drafts.get(id)!==draft || !this.sync.forgeSubjects.some(s=>s.id===id)) return;
    draft.message = ''; draft.conflict = false;
    try {
      const previous = this.sync.state.value.forge;
      const next = savePersonalMemory(previous,draft.baseline,draft.note,draft.synonyms,Date.now());
      if (next !== previous) this.sync.updateForge(next);
      draft.baseline = memorySnapshot(next,id);
      draft.note = draft.baseline.note; draft.synonyms = draft.baseline.values.join('\n');
      draft.message = next === previous ? 'These memory aids are already selected.' : 'Memory aids updated. Check the saving status above.';
    } catch (error) {
      draft.conflict = error instanceof MemoryConflict;
      draft.message = error instanceof Error ? error.message : 'Memory aids could not be updated.';
    }
  }
}
