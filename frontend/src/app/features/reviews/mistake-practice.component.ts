import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MistakePracticeService } from './mistake-practice.service';

@Component({selector:'app-mistake-practice',standalone:true,imports:[CommonModule,FormsModule],
  templateUrl:'./mistake-practice.component.html',styleUrls:['./mistake-practice.component.scss']})
export class MistakePracticeComponent {
  @Output() leave = new EventEmitter<void>();
  @Output() explore = new EventEmitter<string>();
  @ViewChild('answer') private answer?: ElementRef<HTMLInputElement>;
  @ViewChild('feedbackHeading') private feedback?: ElementRef<HTMLElement>;
  @ViewChild('summaryHeading') private summary?: ElementRef<HTMLElement>;
  constructor(public readonly practice: MistakePracticeService) {}
  check(reveal = false): void {
    this.practice.check(reveal);
    if (this.practice.result) requestAnimationFrame(()=>this.feedback?.nativeElement.focus());
  }
  next(): void { this.practice.next();this.focus(); }
  finish(): void { this.practice.finish();this.focus(); }
  restart(): void { this.practice.restart();this.focus(); }
  private focus(): void { requestAnimationFrame(()=>this.practice.complete?this.summary?.nativeElement.focus():this.answer?.nativeElement.focus()); }
}
