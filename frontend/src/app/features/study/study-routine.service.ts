import { Injectable } from '@angular/core';
import { AccountService } from '../account/account.service';
import { HomePreference, HomeProgress, StudyMode, parseHomePreference } from '../home/study-home';
import { studyRoutine } from './study-overview';

/** A shared preference keeps Today and Learn consistent, including when storage is unavailable. */
@Injectable({providedIn:'root'})
export class StudyRoutineService {
  preference: HomePreference | null = null;
  notice = '';
  constructor(private readonly account: AccountService) {
    try { this.preference=parseHomePreference(localStorage.getItem(account.cacheKey('kotoba-study-home-v1'))); }
    catch { this.notice='Your study preference could not be read. Your learning progress is preserved.'; }
  }
  mode(state: HomeProgress): StudyMode { return studyRoutine(state,this.preference); }
  choose(mode: StudyMode): boolean {
    this.preference={version:1,mode};
    try { localStorage.setItem(this.account.cacheKey('kotoba-study-home-v1'),JSON.stringify(this.preference));return true; }
    catch { return false; }
  }
}
