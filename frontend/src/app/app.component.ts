import { StudyHubComponent } from './features/study/study-hub.component';
import { StudySection, sectionFor, isReviewAction } from './features/study/study-overview';
import { SettingsComponent } from './features/settings/settings.component';
import { SaveStatusComponent } from './features/settings/save-status.component';
import { DEMO_MODE } from './demo-mode';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { Subscription } from 'rxjs';
import { StudyCatalogService } from './core/services/study-catalog.service';
import { KanjiCard } from './features/learn/kanji-engine';
import { StudyHomeComponent } from './features/home/study-home.component';
import { StudyAction, StudyLaunch, StudyView, actionView } from './features/home/study-home';
import { ReviewHistoryComponent } from './features/learn/review-history.component';
import { AccountService } from './features/account/account.service';
import { KanjiPathComponent } from './features/learn/kanji-path.component';
import { EncyclopediaComponent } from './features/encyclopedia/encyclopedia.component';
import { ForgeComponent } from './features/forge/forge.component';

@Component({selector: 'app-root', standalone: true,
  imports: [StudyHubComponent, SaveStatusComponent, SettingsComponent, StudyHomeComponent, ReviewHistoryComponent, NgIf, KanjiPathComponent, EncyclopediaComponent, ForgeComponent],
  templateUrl: './app.component.html', styleUrls: ['./app.component.scss']})
export class AppComponent implements OnInit, OnDestroy {
  readonly demoMode = DEMO_MODE;
  menuOpen = false; view: StudyView = 'home'; section: StudySection = 'home'; pathVisited = false;
  cards: KanjiCard[] = []; loading = true; error = ''; launch: StudyLaunch | null = null;
  readonly titles: Record<StudyView, string> = {home:'Your study day',learn:'Your kanji journey',forge:'Kanji Forge',catalog:'Visual reference',history:'Review history',settings:'Profile',learning:'Learn',reviews:'Review',library:'Library'};
  readonly subtitles: Record<StudyView, string> = {home:'A clear next step',learn:'Learn · recall · repeat',forge:'Learn · temper · master',catalog:'Reading encyclopedia',history:'Your saved attempts',settings:'Account · data & privacy',learning:'Your next lesson',reviews:'Strengthen what you know',library:'Explore Japanese'};
  private nextLaunch = 0; private subscription?: Subscription;
  constructor(public readonly account: AccountService, private readonly catalog: StudyCatalogService) {}
  ngOnInit(): void { this.loadCatalog(); }
  loadCatalog(): void {
    this.loading = true; this.error = ''; this.subscription?.unsubscribe();
    this.subscription = this.catalog.load().subscribe({next: cards => {this.cards = cards; this.loading = false;},
      error: () => {this.loading = false; this.error = 'Your study catalog could not be loaded. Check your connection and retry.';}});
  }
  navigate(view: StudyView): void {
    this.view = view; this.section = sectionFor(view); this.menuOpen = false; this.launch = null;
    if (view === 'learn') this.pathVisited = true;
  }
  start(action: StudyAction): void {
    this.view = actionView(action); this.section = isReviewAction(action)?'reviews':'learning'; this.menuOpen = false;
    if (this.view === 'learn') this.pathVisited = true;
    this.launch = {id: ++this.nextLaunch, action};
  }
  launched(id: number): void { if (this.launch?.id === id) this.launch = null; }
  ngOnDestroy(): void { this.subscription?.unsubscribe(); }
}
