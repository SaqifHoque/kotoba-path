import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { KanjiPathComponent } from './features/learn/kanji-path.component';
import { EncyclopediaComponent } from './features/encyclopedia/encyclopedia.component';
import { ForgeComponent } from './features/forge/forge.component';

@Component({selector: 'app-root', standalone: true, imports: [NgIf, KanjiPathComponent, EncyclopediaComponent, ForgeComponent],
  templateUrl: './app.component.html', styleUrls: ['./app.component.scss']})
export class AppComponent {
  menuOpen = false;
  view: 'learn' | 'catalog' | 'forge' = 'learn';
}
