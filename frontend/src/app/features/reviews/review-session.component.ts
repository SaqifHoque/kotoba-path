import { WordAudioComponent } from '../audio/word-audio.component';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { STAGES } from '../forge/forge-engine';
import { REVIEW_BATCH_SIZES } from './review-session';
import { ReviewSessionService } from './review-session.service';

@Component({selector: 'app-review-session', standalone: true, imports: [CommonModule, FormsModule, WordAudioComponent],
  templateUrl: './review-session.component.html', styleUrls: ['./review-session.component.scss']})
export class ReviewSessionComponent {
  @Output() leave = new EventEmitter<void>();
  @Output() explore = new EventEmitter<string>();
  @ViewChild('answer') private answer?: ElementRef<HTMLInputElement>;
  @ViewChild('feedbackHeading') private feedbackHeading?: ElementRef<HTMLElement>;
  @ViewChild('summaryHeading') private summaryHeading?: ElementRef<HTMLElement>;
  readonly stages = STAGES;
  readonly batchSizes = REVIEW_BATCH_SIZES;
  constructor(public readonly review: ReviewSessionService) {}
  get note(): string { const id = this.review.question?.subject.id; return id ? this.review.sync.state.value.forge.records[id]?.note ?? '' : ''; }
  get nextDue(): number | null {
    const times = Object.values(this.review.sync.state.value.forge.records).flatMap(record => [record.meaning, record.reading])
      .filter(track => track && track.due !== null && track.due > Date.now()).map(track => track!.due!);
    return times.length ? Math.min(...times) : null;
  }
  check(dontKnow = false): void {
    this.review.check(dontKnow);
    if (this.review.feedback && this.review.feedback.status !== 'retry') requestAnimationFrame(() => this.feedbackHeading?.nativeElement.focus());
  }
  next(): void { this.review.next(); this.focusNext(); }
  finish(): void { this.review.finish(); this.focusNext(); }
  begin(): void { this.review.begin(Number(this.review.limit)); this.focusNext(); }
  private focusNext(): void {
    requestAnimationFrame(() => this.review.complete ? this.summaryHeading?.nativeElement.focus() : this.answer?.nativeElement.focus());
  }
}
