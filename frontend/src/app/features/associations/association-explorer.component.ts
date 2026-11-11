import { WordAudioComponent } from '../audio/word-audio.component';
import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { STAGES, Subject, mastery } from '../forge/forge-engine';
import { StudySyncService } from '../learn/study-sync.service';
import { STARTER_CHAPTER } from '../chapters/starter-chapter';
import { AssociationDetails, AssociationIndex, buildAssociationIndex } from './association-index';
import { AssociationMatches, AssociationSearch, associationSearch } from './association-search';

@Component({selector: 'app-association-explorer', standalone: true, imports: [CommonModule, FormsModule, WordAudioComponent],
  templateUrl: './association-explorer.component.html', styleUrls: ['./association-explorer.component.scss']})
export class AssociationExplorerComponent implements OnChanges {
  @Input() subjects: Subject[] = [];
  @Input() subjectId = 'k:休';
  @Input() returnLabel = 'Return to Library';
  @Output() selected = new EventEmitter<string>();
  @Output() leave = new EventEmitter<void>();
  @ViewChild('itemHeading') private heading?: ElementRef<HTMLElement>;
  query = '';
  matches: AssociationMatches = {items: [], total: 0};
  detail: AssociationDetails | null = null;
  available = true;
  wordLimit = 12;
  kanjiLimit = 12;
  private currentId = '';
  private history: string[] = [];
  private index?: AssociationIndex;
  private search?: AssociationSearch;
  constructor(private readonly sync: StudySyncService) {}
  ngOnChanges(changes: SimpleChanges): void {
    try {
      if (changes['subjects']) {
        this.index = buildAssociationIndex(this.subjects);
        this.search = associationSearch(this.subjects);
        this.searchItems();
        this.available = true;
      }
      if (changes['subjects'] || (changes['subjectId'] && this.subjectId !== this.currentId)) this.show(this.subjectId);
    } catch { this.available = false; this.detail = null; }
  }
  searchItems(): void { this.matches = this.search?.(this.query) ?? {items: [], total: 0}; }
  select(id: string): void {
    if (!this.index?.subjects.has(id)) return;
    if (this.currentId && this.currentId !== id) this.history = [...this.history, this.currentId].slice(-20);
    this.show(id); this.selected.emit(id); this.focusItem();
  }
  get canGoBack(): boolean { return !!this.history.length; }
  back(): void { const id = this.history.pop(); if (id) { this.show(id); this.selected.emit(id); this.focusItem(); } }
  get note(): string { return this.detail ? this.sync.state.value.forge.records[this.detail.subject.id]?.note ?? '' : ''; }
  get synonyms(): string[] { return this.detail ? this.sync.state.value.forge.meaningSynonyms?.[this.detail.subject.id]?.values ?? [] : []; }
  get stage(): string { return STAGES[mastery(this.detail ? this.sync.state.value.forge.records[this.detail.subject.id] : undefined)] || 'Locked'; }
  get introduced(): boolean { return !!this.detail && !!this.sync.state.value.forge.records[this.detail.subject.id]; }
  get chapterWord() { return STARTER_CHAPTER.words.find(word => word.id === this.detail?.subject.id); }
  get chapterKanji() { return STARTER_CHAPTER.kanji.find(item => item.subjectId === this.detail?.subject.id); }
  kind(subject: Subject): string { return subject.kind === 'radical' ? 'Dictionary radical' : subject.kind === 'vocabulary' ? 'Word' : 'Kanji'; }
  trackSubject(_index: number, subject: Subject): string { return subject.id; }
  private show(id: string): void { this.currentId = id; this.detail = this.index?.details(id) ?? null; this.wordLimit = 12; this.kanjiLimit = 12; }
  private focusItem(): void { requestAnimationFrame(() => this.heading?.nativeElement.focus()); }
}
