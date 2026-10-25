import { createBackup, parseBackup, summarizeImport, progressFingerprint, ProgressImport, ImportSummary, LegacyKind } from './progress-backup';
import { Component, EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountComponent } from '../account/account.component';
import { AccountService } from '../account/account.service';
import { StudySyncService } from '../learn/study-sync.service';
import { KanjiCard } from '../learn/kanji-engine';
import { DEMO_MODE } from '../../demo-mode';

@Component({selector:'app-settings',standalone:true,imports:[CommonModule,FormsModule,AccountComponent],
  templateUrl:'./settings.component.html',styleUrls:['./settings.component.scss']})
export class SettingsComponent implements OnDestroy {
  @Input() cards: KanjiCard[] = [];
  @Output() imported = new EventEmitter<void>();
  preview: ProgressImport | null = null;
  summary: ImportSummary | null = null;
  filename = ''; legacy: LegacyKind | '' = ''; olderFile = false; error = ''; reading = false;
  private text = ''; private baseline = ''; private owner = ''; private readId = 0;
  readonly demo = DEMO_MODE;
  message = '';
  constructor(public readonly sync: StudySyncService, public readonly account: AccountService) {}
  download(): void {
    const backup = createBackup(this.sync.state.value,Date.now());
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup)],{type:'application/json'}));
    const a = document.createElement('a');
    a.href=url; a.download='kotoba-learning-progress.json'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    this.message='Learning data prepared for download. Check your browser’s downloads.';
  }
  async chooseFile(event: Event): Promise<void> {
    const input=event.target as HTMLInputElement, file=input.files?.[0], id=++this.readId;
    this.clearPreview(); this.message=''; this.error='';
    if (!file) return;
    this.reading=true;
    try {
      if (file.size>32000000) throw new Error('Choose a progress file smaller than 32 MB.');
      const text=await file.text();
      if (id!==this.readId||this.account.changing) return;
      this.text=text; this.filename=file.name;
      const value=JSON.parse(text);
      this.olderFile=value?.format===undefined&&value?.version===1&&value?.cards!==undefined;
      if (!this.olderFile) this.previewFile();
    } catch(error) { if(id===this.readId)this.error=error instanceof Error?error.message:'This progress file could not be read.'; }
    finally { if(id===this.readId)this.reading=false; input.value=''; }
  }
  previewFile(): void {
    this.preview=null; this.summary=null; this.error='';
    try {
      const parsed=parseBackup(this.text,this.cards,this.sync.forgeSubjects,this.legacy||undefined);
      this.preview=parsed;
      this.summary=summarizeImport(this.sync.state.value,parsed);
      this.baseline=progressFingerprint(this.sync.state.value);
      this.owner=this.account.account.id;
    } catch(error) { this.error=error instanceof Error?error.message:'This progress file could not be read.'; }
  }
  confirmImport(): void {
    if (!this.preview||!this.sync.ready||this.account.changing||this.reading) return;
    if (this.owner!==this.account.account.id) { this.clearPreview(); this.error='Your account changed. Choose the file again for the current account.'; return; }
    if (this.baseline!==progressFingerprint(this.sync.state.value)) {
      this.previewFile();
      this.message='Your progress changed while this preview was open. Review the refreshed counts and confirm again.';
      return;
    }
    try {
      this.sync.importProgress(this.preview);
      this.clearPreview(); this.imported.emit();
      this.message='Progress merged. Check the saving message above before leaving.';
    } catch(error) { this.error=error instanceof Error?error.message:'Progress could not be imported.'; }
  }
  cancelImport(): void { this.readId++; this.reading=false; this.clearPreview(); this.error=''; this.message='Import cancelled. Your progress has not changed.'; }
  private clearPreview(): void { this.preview=null;this.summary=null;this.text='';this.filename='';this.legacy='';this.olderFile=false;this.baseline='';this.owner=''; }
  ngOnDestroy(): void { this.readId++; }

}
