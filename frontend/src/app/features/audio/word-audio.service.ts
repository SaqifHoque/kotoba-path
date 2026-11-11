import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AudioPlayer, emptyAudioState } from './audio-player';
import { AudioWord, WordAudioRate } from './word-audio';

@Injectable({providedIn: 'root'})
export class WordAudioService implements OnDestroy {
  private readonly state = new BehaviorSubject(emptyAudioState());
  readonly state$ = this.state.asObservable();
  private readonly player: AudioPlayer;
  private utterance: SpeechSynthesisUtterance | null = null;
  private readonly synthesis: SpeechSynthesis | null;
  private readonly voicesChanged = () => this.player.refresh();
  private readonly visibilityChanged = () => { if (document.hidden) this.stop(); else this.refresh(); };
  private readonly pageHidden = () => this.stop();
  constructor(zone: NgZone) {
    let synthesis: SpeechSynthesis | null = null;
    try { if (typeof window !== 'undefined' && typeof SpeechSynthesisUtterance === 'function') synthesis = window.speechSynthesis ?? null; }
    catch { /* Browsers can deny speech access. The UI remains usable without audio. */ }
    this.synthesis = synthesis;
    this.player = new AudioPlayer({
      supported: !!synthesis,
      voices: () => synthesis?.getVoices() ?? [],
      speak: (request, callbacks) => {
        const voice = synthesis?.getVoices().find(voice => voice.voiceURI === request.voice.voiceURI && /^ja(?:[-_]|$)/i.test(voice.lang));
        if (!synthesis || !voice) throw new Error('Japanese voice unavailable');
        const utterance = new SpeechSynthesisUtterance(request.text);
        utterance.lang = voice.lang; utterance.voice = voice; utterance.rate = request.rate;
        utterance.onstart = () => callbacks.start();
        utterance.onend = () => { if (this.utterance === utterance) this.utterance = null; callbacks.end(); };
        utterance.onerror = () => { if (this.utterance === utterance) this.utterance = null; callbacks.error(); };
        this.utterance = utterance;
        synthesis.speak(utterance);
      },
      cancel: () => { this.utterance = null; synthesis?.cancel(); },
      later: (callback, delay) => { const timer = setTimeout(callback, delay); return () => clearTimeout(timer); }
    }, state => zone.run(() => this.state.next(state)));
    synthesis?.addEventListener('voiceschanged', this.voicesChanged);
    if (typeof document !== 'undefined') document.addEventListener('visibilitychange', this.visibilityChanged);
    if (typeof window !== 'undefined') window.addEventListener('pagehide', this.pageHidden);
  }
  play(owner: string, word: AudioWord, reading: string, rate: WordAudioRate): void { this.player.play(owner, word, reading, rate); }
  stop(owner?: string): void { this.player.stop(owner); }
  refresh(): void { this.player.refresh(); }
  ngOnDestroy(): void {
    this.stop(); this.synthesis?.removeEventListener('voiceschanged', this.voicesChanged);
    if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', this.visibilityChanged);
    if (typeof window !== 'undefined') window.removeEventListener('pagehide', this.pageHidden);
    this.state.complete();
  }
}
