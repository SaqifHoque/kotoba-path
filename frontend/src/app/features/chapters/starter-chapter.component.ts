import { WordAudioService } from '../audio/word-audio.service';
import { WordAudioComponent } from '../audio/word-audio.component';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KanjiCard } from '../learn/kanji-curriculum';
import { validateChapter } from './chapter';
import { GuidedLessonService } from './guided-lesson.service';
import { STARTER_CHAPTER } from './starter-chapter';

@Component({
  selector: 'app-starter-chapter', standalone: true, imports: [CommonModule, WordAudioComponent],
  templateUrl: './starter-chapter.component.html', styleUrls: ['./starter-chapter.component.scss']
})
export class StarterChapterComponent implements OnChanges {
  @Output() explore = new EventEmitter<string>();
  @Output() guide = new EventEmitter<void>();
  constructor(public readonly lesson: GuidedLessonService, private readonly audio: WordAudioService) {}
  @Input() cards: KanjiCard[] = [];
  readonly chapter = STARTER_CHAPTER;
  showReadings = true;
  available = false;
  private characters = new Map<string, string>();

  ngOnChanges(): void {
    this.available = false;
    try {
      validateChapter(this.chapter, this.cards);
      this.characters = new Map(this.cards.map(card => [card.curriculum?.id ?? `k:${card.character}`, card.character]));
      this.available = true;
      this.lesson.restore();
    } catch { /* Keep the existing courses available if chapter content is incompatible. */ }
  }
  chapterToggled(event: Event): void { if (!(event.target as HTMLDetailsElement).open) this.audio.stop(); }
  character(id: string): string { return this.characters.get(id) ?? ''; }
  shape(id: string) { return this.chapter.shapes.find(shape => shape.id === id)!; }
}
