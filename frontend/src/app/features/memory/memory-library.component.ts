import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MemoryLibraryService } from './memory-library.service';

@Component({selector:'app-memory-library',standalone:true,imports:[CommonModule,FormsModule],
  templateUrl:'./memory-library.component.html',styleUrls:['./memory-library.component.scss']})
export class MemoryLibraryComponent {
  @Output() explore = new EventEmitter<string>();
  @Output() leave = new EventEmitter<void>();
  constructor(public readonly library: MemoryLibraryService) {}
  kind(kind: string): string { return kind==='vocabulary'?'Word':kind==='radical'?'Dictionary radical':'Kanji'; }
}
