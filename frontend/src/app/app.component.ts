import { StudyHubComponent } from './features/study/study-hub.component';
import { OpenSession, StudySection, sectionFor, isReviewAction } from './features/study/study-overview';
import { SettingsComponent } from './features/settings/settings.component';
import { SaveStatusComponent } from './features/settings/save-status.component';
import { DEMO_MODE } from './demo-mode';
import { Component, OnDestroy, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
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
  menuOpen = false; view: StudyView = 'home'; section: StudySection = 'home'; pathVisited = false; forgeVisited = false;
  @ViewChild(KanjiPathComponent) private path?: KanjiPathComponent;
  @ViewChild(ForgeComponent) private forge?: ForgeComponent;
  private lastSessionView: 'learn'|'forge'|null = null;
  cards: KanjiCard[] = []; loading = true; error = ''; launch: StudyLaunch | null = null;
  readonly titles: Record<StudyView, string> = {home:'Your study day',learn:'Your kanji journey',forge:'Kanji Forge',catalog:'Visual reference',history:'Review history',settings:'Profile',learning:'Learn',reviews:'Review',library:'Library'};
  readonly subtitles: Record<StudyView, string> = {home:'A clear next step',learn:'Learn · recall · repeat',forge:'Learn · temper · master',catalog:'Reading encyclopedia',history:'Your saved attempts',settings:'Account · data & privacy',learning:'Your next lesson',reviews:'Strengthen what you know',library:'Explore Japanese'};
  @ViewChild('mainContent') private content?: ElementRef<HTMLElement>;
  @ViewChild('menuToggle') private menuToggle?: ElementRef<HTMLButtonElement>;
  private readonly media=window.matchMedia('(max-width:850px)');
  compactNavigation=this.media.matches;
  private readonly navChanged=()=>{this.compactNavigation=this.media.matches;this.menuOpen=false;};
  private nextLaunch = 0; private subscription?: Subscription;
  constructor(public readonly account: AccountService, private readonly catalog: StudyCatalogService) {}
  ngOnInit(): void { this.media.addEventListener('change',this.navChanged);this.loadCatalog(); }
  loadCatalog(): void {
    this.loading = true; this.error = ''; this.subscription?.unsubscribe();
    this.subscription = this.catalog.load().subscribe({next: cards => {this.cards = cards; this.loading = false;},
      error: () => {this.loading = false; this.error = 'Your study catalog could not be loaded. Check your connection and retry.';}});
  }
  navigate(view: StudyView): void {
    this.view = view; this.section = sectionFor(view); this.menuOpen = false; this.launch = null;
    if (view === 'learn') this.pathVisited = true;
    if (view === 'forge') this.forgeVisited = true;
    this.focusContent();
  }
  start(action: StudyAction): void {
    this.view = actionView(action); this.section = isReviewAction(action)?'reviews':'learning'; this.menuOpen = false;
    if (this.view === 'learn') this.pathVisited = true;
    if (this.view === 'forge') this.forgeVisited = true;
    this.lastSessionView=this.view as 'learn'|'forge';
    this.launch = {id: ++this.nextLaunch, action};
    this.focusContent();
  }
  get openSessions(): OpenSession[] { return [this.path?.openSession,this.forge?.openSession].filter((s):s is OpenSession=>!!s); }
  get currentSession(): OpenSession | null { return this.openSessions.find(s=>s.view===this.lastSessionView)??this.openSessions[0]??null; }
  resume(session: OpenSession): void {
    this.navigate(session.view);this.section=session.review?'reviews':'learning';this.lastSessionView=session.view;
  }
  resetSessions(): void { this.pathVisited=false;this.forgeVisited=false;this.launch=null;this.lastSessionView=null; }
  launched(id: number): void { if (this.launch?.id === id) this.launch = null; }
  toggleNavigation(): void { this.menuOpen=!this.menuOpen; }
  @HostListener('document:keydown.escape') closeNavigation(): void {
    if(this.menuOpen){this.menuOpen=false;this.menuToggle?.nativeElement.focus();}
  }
  private focusContent(): void { requestAnimationFrame(()=>this.content?.nativeElement.focus({preventScroll:true})); }
  ngOnDestroy(): void { this.subscription?.unsubscribe();this.media.removeEventListener('change',this.navChanged); }
}
