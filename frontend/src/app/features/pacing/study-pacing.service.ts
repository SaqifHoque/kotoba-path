import { Injectable } from '@angular/core';
import { AccountService } from '../account/account.service';
import { StudySyncService } from '../learn/study-sync.service';
import { studyPacing } from './study-pacing';

@Injectable({providedIn:'root'})
export class StudyPacingService {
  constructor(private readonly sync: StudySyncService, private readonly account: AccountService) {}
  get ready(): boolean { return this.sync.ready && !this.account.changing; }
  snapshot(now = Date.now()) {
    return this.ready ? studyPacing(this.sync.forgeSubjects,this.sync.state.value.forge,now) : null;
  }
  setLimit(limit: number): boolean {
    if (!this.ready || ![5,10,20].includes(limit)) return false;
    const current = this.sync.state.value.forge;
    if (current.dailyLimit !== limit) this.sync.updateForge({...current,dailyLimit:limit,settingsAt:Date.now()});
    return true;
  }
}
