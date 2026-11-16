import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { KanjiCard } from '../learn/kanji-curriculum';
import { validateChapter } from './chapter';
import { ChapterProgressService } from './chapter-progress.service';

@Component({
  selector:'app-chapter-progress',
  standalone:true,
  imports:[CommonModule],
  templateUrl:'./chapter-progress.component.html',
  styleUrls:['./chapter-progress.component.scss']
})
export class ChapterProgressComponent implements OnChanges, OnInit, OnDestroy {
  @Input() cards: KanjiCard[] = [];
  @Output() guide = new EventEmitter<void>();
  @Output() reviews = new EventEmitter<void>();
  @Output() reading = new EventEmitter<void>();
  @Output() explore = new EventEmitter<string>();
  available = false;
  now = Date.now();
  private timer?: ReturnType<typeof setInterval>;
  constructor(public readonly progress: ChapterProgressService) {}
  ngOnChanges(): void {
    try { validateChapter(this.progress.chapter,this.cards); this.available = true; }
    catch { this.available = false; }
  }
  ngOnInit(): void { this.timer = setInterval(()=>{this.now=Date.now();},10000); }
  ngOnDestroy(): void { if (this.timer) clearInterval(this.timer); }
  get snapshot() { return this.available ? this.progress.snapshot(this.now) : null; }
}
