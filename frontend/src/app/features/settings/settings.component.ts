import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountComponent } from '../account/account.component';
import { AccountService } from '../account/account.service';
import { StudySyncService } from '../learn/study-sync.service';
import { KanjiCard } from '../learn/kanji-engine';
import { DEMO_MODE } from '../../demo-mode';

@Component({selector:'app-settings',standalone:true,imports:[CommonModule,AccountComponent],
  templateUrl:'./settings.component.html',styleUrls:['./settings.component.scss']})
export class SettingsComponent {
  @Input() cards: KanjiCard[] = [];
  readonly demo = DEMO_MODE;
  message = '';
  constructor(public readonly sync: StudySyncService, public readonly account: AccountService) {}
  download(): void {
    const {profile,kanji,vocabulary,forge} = this.sync.state.value;
    const backup = {format:'kotoba-path-progress',version:1,exportedAt:Date.now(),progress:{profile,kanji,vocabulary,forge}};
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup)],{type:'application/json'}));
    const a = document.createElement('a');
    a.href=url; a.download='kotoba-learning-progress.json'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    this.message='Learning data prepared for download. Check your browser’s downloads.';
  }
}
