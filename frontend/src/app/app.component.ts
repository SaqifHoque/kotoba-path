import { AccountComponent } from './features/account/account.component';
import { AccountService } from './features/account/account.service';
import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { KanjiPathComponent } from './features/learn/kanji-path.component';
import { EncyclopediaComponent } from './features/encyclopedia/encyclopedia.component';
import { ForgeComponent } from './features/forge/forge.component';

@Component({selector: 'app-root', standalone: true, imports: [AccountComponent, NgIf, KanjiPathComponent, EncyclopediaComponent, ForgeComponent],
  templateUrl: './app.component.html', styleUrls: ['./app.component.scss']})
export class AppComponent {
  constructor(public readonly account: AccountService) {}
  menuOpen = false;
  view: 'learn' | 'catalog' | 'forge' = 'learn';
}
