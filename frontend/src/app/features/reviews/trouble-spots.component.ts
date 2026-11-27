import { KanjiComparisonService } from '../associations/kanji-comparison.service';
import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TroubleSpot } from './trouble-spots';
import { TroubleSpotsService } from './trouble-spots.service';

@Component({selector:'app-trouble-spots',standalone:true,imports:[CommonModule,FormsModule],
  templateUrl:'./trouble-spots.component.html',styleUrls:['./trouble-spots.component.scss']})
export class TroubleSpotsComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() compare = new EventEmitter<string>();
  @Output() explore = new EventEmitter<string>();
  @Output() practise = new EventEmitter<void>();
  @Output() leave = new EventEmitter<void>();
  @ViewChild('title') private title?: ElementRef<HTMLElement>;
  now = Date.now();
  private timer?: ReturnType<typeof setInterval>;
  private frame?: number;
  constructor(public readonly comparison: KanjiComparisonService, public readonly spots: TroubleSpotsService) {}
  ngOnInit(): void { this.timer=setInterval(()=>this.now=Date.now(),10000); }
  ngAfterViewInit(): void {
    if (!this.spots.returnItem) return;
    this.frame=requestAnimationFrame(()=>{
      this.frame=undefined;
      const row=document.getElementById('trouble-'+this.spots.returnItem);
      (row??this.title?.nativeElement)?.focus({preventScroll:true});
      window.scrollTo(0,row?this.spots.scrollY:0);
    });
  }
  open(item: TroubleSpot): void {
    this.spots.returnItem=this.track(0,item);this.spots.scrollY=window.scrollY;this.explore.emit(item.subject.id);
  }
  compareItem(item: TroubleSpot): void {
    this.spots.returnItem=this.track(0,item);this.spots.scrollY=window.scrollY;this.compare.emit(item.subject.id);
  }
  track(_index: number,item: TroubleSpot): string { return item.subject.id+':'+item.skill; }
  kind(item: TroubleSpot): string { return item.subject.kind==='vocabulary'?'Word':item.subject.kind==='radical'?'Dictionary radical':'Kanji'; }
  ngOnDestroy(): void { if(this.timer)clearInterval(this.timer);if(this.frame!==undefined)cancelAnimationFrame(this.frame); }
}
