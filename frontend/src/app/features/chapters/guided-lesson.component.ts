import { Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KanjiCard } from '../learn/kanji-curriculum';
import { validateChapter } from './chapter';
import { GuidedLessonService } from './guided-lesson.service';

@Component({selector: 'app-guided-lesson', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './guided-lesson.component.html', styleUrls: ['./guided-lesson.component.scss']})
export class GuidedLessonComponent implements OnChanges, OnDestroy {
  @Input() cards: KanjiCard[] = [];
  @Output() explore = new EventEmitter<string>();
  @Output() leave = new EventEmitter<'learning' | 'reviews'>();
  @ViewChild('heading') private heading?: ElementRef<HTMLElement>;
  @ViewChild('answer') private answer?: ElementRef<HTMLInputElement>;
  available = false;
  moving = false;
  private timer?: ReturnType<typeof setTimeout>;
  constructor(public readonly lesson: GuidedLessonService) {}
  ngOnChanges(): void {
    try { validateChapter(this.lesson.chapter, this.cards); this.available = true; this.lesson.restore(); }
    catch { this.available = false; }
  }
  get shape() { const step = this.lesson.step; return step?.kind === 'shape' ? this.lesson.chapter.shapes.find(shape => shape.id === step.shapeId) : undefined; }
  get kanji() { const subject = this.lesson.subject; return this.lesson.chapter.kanji.find(item => item.subjectId === subject?.id); }
  get word() { const subject = this.lesson.subject; return this.lesson.chapter.words.find(item => item.id === subject?.id); }
  next(): void {
    if (this.moving) return;
    this.moving = true;
    this.lesson.next();
    this.timer = setTimeout(() => { this.moving = false; if (this.lesson.step?.kind === 'check' && !this.lesson.feedback) this.answer?.nativeElement.focus(); else this.heading?.nativeElement.focus(); }, 250);
  }
  retry(): void { this.lesson.retryAnswer(); requestAnimationFrame(() => this.answer?.nativeElement.focus()); }
  ngOnDestroy(): void { if (this.timer) clearTimeout(this.timer); }
}
