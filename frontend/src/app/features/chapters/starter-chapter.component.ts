import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KanjiCard } from '../learn/kanji-curriculum';
import { validateChapter } from './chapter';
import { STARTER_CHAPTER } from './starter-chapter';

@Component({
  selector: 'app-starter-chapter', standalone: true, imports: [CommonModule],
  templateUrl: './starter-chapter.component.html', styleUrls: ['./starter-chapter.component.scss']
})
export class StarterChapterComponent implements OnChanges {
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
    } catch { /* Keep the existing courses available if chapter content is incompatible. */ }
  }
  character(id: string): string { return this.characters.get(id) ?? ''; }
  shape(id: string) { return this.chapter.shapes.find(shape => shape.id === id)!; }
}
