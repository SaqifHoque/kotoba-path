import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { StudySyncService } from '../learn/study-sync.service';
import { StudyPacing } from './study-pacing';
import { StudyPacingService } from './study-pacing.service';

let nextPacing = 0;
@Component({selector:'app-study-pacing',standalone:true,imports:[CommonModule,FormsModule],
  templateUrl:'./study-pacing.component.html',styleUrls:['./study-pacing.component.scss']})
export class StudyPacingComponent implements OnInit, OnDestroy {
  @Output() typedReviews = new EventEmitter<number>();
  @Output() reviews = new EventEmitter<void>();
  model: StudyPacing | null = null;
  draftLimit = 10;
  notice = '';
  readonly selectId = 'study-pace-' + ++nextPacing;
  private observedLimit?: number;
  private refreshedAt = 0;
  private subscription?: Subscription;
  private timer?: ReturnType<typeof setInterval>;
  constructor(public readonly pacing: StudyPacingService, private readonly sync: StudySyncService) {}
  ngOnInit(): void {
    this.subscription = this.sync.state.subscribe(()=>this.refresh());
    this.timer = setInterval(()=>{
      if (!this.model || Date.now()-this.refreshedAt>=10000) this.refresh();
    },1000);
  }
  private refresh(): void {
    this.model = this.pacing.snapshot();
    this.refreshedAt = Date.now();
    if (this.model && this.observedLimit !== this.model.limit) {
      this.observedLimit = this.model.limit; this.draftLimit = this.model.limit; this.notice = '';
    }
  }
  save(): void {
    const changed = this.model?.limit !== this.draftLimit;
    if (!this.pacing.setLimit(this.draftLimit)) {
      this.notice = 'Wait for your account and saved progress to be ready.'; return;
    }
    this.refresh();
    this.notice = changed ? 'Daily limit updated. Check the saving status above for device and server saving.' : 'This daily limit is already selected.';
  }
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    if (this.timer) clearInterval(this.timer);
  }
}
