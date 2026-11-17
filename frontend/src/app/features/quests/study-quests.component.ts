import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { StudySyncService } from '../learn/study-sync.service';
import { StudyQuestsService } from './study-quests.service';

@Component({selector:'app-study-quests',standalone:true,imports:[CommonModule],
  templateUrl:'./study-quests.component.html',styleUrls:['./study-quests.component.scss']})
export class StudyQuestsComponent implements OnInit, OnDestroy {
  @Output() reviews = new EventEmitter<void>();
  private subscription?: Subscription;
  private timer?: ReturnType<typeof setInterval>;
  private debounce?: ReturnType<typeof setTimeout>;
  constructor(public readonly quests: StudyQuestsService, private readonly sync: StudySyncService) {}
  ngOnInit(): void {
    this.subscription = this.sync.state.subscribe(()=>{
      if (this.debounce) clearTimeout(this.debounce);
      this.debounce = setTimeout(()=>void this.quests.refresh(true),300);
    });
    this.timer = setInterval(()=>{
      if (!this.quests.visible || Date.now()-this.quests.lastUpdated >= 30000) void this.quests.refresh();
    },1000);
    void this.quests.refresh();
  }
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    if (this.timer) clearInterval(this.timer);
    if (this.debounce) clearTimeout(this.debounce);
  }
}
