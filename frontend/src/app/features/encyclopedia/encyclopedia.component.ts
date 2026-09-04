import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogService } from '../../core/services/catalog.service';
import { CatalogPage, KanjiDetail, KanjiSummary, RadicalDetail, ReadingToken } from '../../core/models/catalog.models';

@Component({selector:'app-encyclopedia',standalone:true,imports:[NgFor,NgIf,FormsModule],templateUrl:'./encyclopedia.component.html',styleUrls:['./encyclopedia.component.scss']})
export class EncyclopediaComponent implements OnInit {
  mode:'browse'|'reader'='browse'; query=''; jlpt=''; page?:CatalogPage; detail?:KanjiDetail; radical?:RadicalDetail; readerText='今日は学校で日本語を勉強します。'; tokens:ReadingToken[]=[]; loading=false;
  constructor(private readonly catalog:CatalogService){}
  ngOnInit():void{this.search();}
  search(page=0):void{this.loading=true;this.catalog.search(this.query,this.jlpt,page).subscribe(result=>{this.page=result;this.loading=false;});}
  openKanji(item:KanjiSummary|string):void{const c=typeof item==='string'?item:item.character;this.loading=true;this.radical=undefined;this.catalog.kanji(c).subscribe(value=>{this.detail=value;this.loading=false;window.scrollTo({top:0,behavior:'smooth'});});}
  openRadical(character:string):void{this.catalog.radical(character).subscribe(value=>{this.radical=value;this.detail=undefined;window.scrollTo({top:0,behavior:'smooth'});});}
  analyze():void{this.loading=true;this.catalog.analyze(this.readerText).subscribe(value=>{this.tokens=value;this.loading=false;});}
  back():void{this.detail=undefined;this.radical=undefined;}
}
