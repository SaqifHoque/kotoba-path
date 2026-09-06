import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { KanjiPathComponent } from './features/learn/kanji-path.component';
import { EncyclopediaComponent } from './features/encyclopedia/encyclopedia.component';

@Component({selector: 'app-root', standalone: true, imports: [NgIf, KanjiPathComponent, EncyclopediaComponent],
  templateUrl: './app.component.html', styleUrls: ['./app.component.scss']})
export class AppComponent {
  menuOpen = false;
  view: 'learn' | 'catalog' = 'learn';
}
