import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MemoryLibraryService } from './memory-library.service';

@Component({selector:'app-memory-library',standalone:true,imports:[CommonModule,FormsModule],
  templateUrl:'./memory-library.component.html',styleUrls:['./memory-library.component.scss']})
export class MemoryLibraryComponent implements AfterViewInit, OnDestroy {
  @ViewChild('title') private title?: ElementRef<HTMLElement>;
  private frame?: number;
  @Output() explore = new EventEmitter<string>();
  @Output() leave = new EventEmitter<void>();
  constructor(public readonly library: MemoryLibraryService) {}
  open(id: string): void {
    this.library.returnItem = id; this.library.scrollY = window.scrollY; this.explore.emit(id);
  }
  ngAfterViewInit(): void {
    if (!this.library.returnItem) return;
    this.frame = requestAnimationFrame(()=>{
      this.frame = undefined;
      const item = document.getElementById('memory-item-'+this.library.returnItem);
      (item ?? this.title?.nativeElement)?.focus({preventScroll:true});
      window.scrollTo(0,item?this.library.scrollY:0);
    });
  }
  ngOnDestroy(): void { if (this.frame !== undefined) cancelAnimationFrame(this.frame); }
  kind(kind: string): string { return kind==='vocabulary'?'Word':kind==='radical'?'Dictionary radical':'Kanji'; }
}
