import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WordAudioComponent } from '../audio/word-audio.component';
import { WordAudioService } from '../audio/word-audio.service';
import { ReadingPracticeService } from './reading-practice.service';

@Component({selector:'app-reading-practice',standalone:true,imports:[CommonModule,FormsModule,WordAudioComponent],
  templateUrl:'./reading-practice.component.html',styleUrls:['./reading-practice.component.scss']})
export class ReadingPracticeComponent {
  @Output() leave = new EventEmitter<void>();
  @Output() explore = new EventEmitter<string>();
  @ViewChild('heading') heading?: ElementRef<HTMLElement>;
  @ViewChild('feedback') feedback?: ElementRef<HTMLElement>;
  constructor(public readonly reading: ReadingPracticeService, private readonly audio: WordAudioService) {}
  get parts() {
    const c = this.reading.card;
    if (!c?.target) return null;
    const [before, after] = c.text.split(c.target.text);
    return {before,after,target:c.target.text};
  }
  get disclosed() {
    const r = this.reading;
    return !!r.card && r.attempt?.answers.length === r.card.questions.length;
  }
  check(reveal = false): void {
    this.reading.check(reveal);
    if (this.reading.attempt?.reading) this.focusFeedback();
  }
  choose(choice: number): void { this.reading.choose(choice); this.focusFeedback(); }
  next(): void { this.audio.stop(); this.reading.next(); requestAnimationFrame(()=>this.heading?.nativeElement.focus()); }
  begin(wordId?: string): void { this.audio.stop(); this.reading.begin(wordId); requestAnimationFrame(()=>this.heading?.nativeElement.focus()); }
  finish(): void { this.audio.stop(); this.reading.finish(); requestAnimationFrame(()=>this.heading?.nativeElement.focus()); }
  lookup(): void {
    if (this.reading.card?.wordId) { this.reading.help('lookup'); this.explore.emit(this.reading.card.wordId); }
  }
  private focusFeedback(): void { requestAnimationFrame(()=>this.feedback?.nativeElement.focus()); }
}
