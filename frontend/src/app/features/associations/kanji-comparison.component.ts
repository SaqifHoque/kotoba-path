import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { KanjiComparisonService } from './kanji-comparison.service';

@Component({selector:'app-kanji-comparison',standalone:true,imports:[CommonModule,FormsModule],
  templateUrl:'./kanji-comparison.component.html',styleUrls:['./kanji-comparison.component.scss']})
export class KanjiComparisonComponent implements AfterViewInit, OnDestroy {
  @Output() explore=new EventEmitter<string>();
  @Output() leave=new EventEmitter<void>();
  @ViewChild('title') private title?: ElementRef<HTMLElement>;
  private frame?: number;
  constructor(public readonly comparison: KanjiComparisonService) {}
  open(id: string,buttonId: string): void {
    this.comparison.returnItem=buttonId;this.comparison.scrollY=window.scrollY;this.explore.emit(id);
  }
  ngAfterViewInit(): void {
    if (!this.comparison.returnItem) return;
    this.frame=requestAnimationFrame(()=>{
      this.frame=undefined;
      const button=document.getElementById(this.comparison.returnItem);
      (button??this.title?.nativeElement)?.focus({preventScroll:true});
      window.scrollTo(0,button?this.comparison.scrollY:0);
    });
  }
  ngOnDestroy(): void { if(this.frame!==undefined)cancelAnimationFrame(this.frame); }
}
