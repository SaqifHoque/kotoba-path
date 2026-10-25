import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DEMO_MODE } from '../../demo-mode';
import { StudySyncService } from '../learn/study-sync.service';

@Component({selector:'app-save-status',standalone:true,imports:[CommonModule],
  templateUrl:'./save-status.component.html',styleUrls:['./save-status.component.scss']})
export class SaveStatusComponent {
  @Output() settings = new EventEmitter<void>();
  readonly demo = DEMO_MODE;
  constructor(public readonly sync: StudySyncService) {}
}
