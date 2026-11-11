import { AudioWord, JapaneseVoice, WordAudioRate, japaneseVoice } from './word-audio';

export interface SpeechRequest { text: string; voice: JapaneseVoice; rate: WordAudioRate; }
export interface SpeechCallbacks { start(): void; end(): void; error(): void; }
export interface SpeechPort {
  supported: boolean;
  voices(): JapaneseVoice[];
  speak(request: SpeechRequest, callbacks: SpeechCallbacks): void;
  cancel(): void;
  later(callback: () => void, delay: number): () => void;
}
export interface AudioState {
  supported: boolean; available: boolean; localVoice: boolean;
  owner: string | null; phase: 'idle' | 'starting' | 'speaking' | 'error'; message: string;
}
export const emptyAudioState = (): AudioState => ({supported: false, available: false, localVoice: false, owner: null, phase: 'idle', message: ''});

/** One utterance per tab. Ownership and generations isolate cancelled/stale callbacks. */
export class AudioPlayer {
  private state = emptyAudioState();
  private voice: JapaneseVoice | null = null;
  private activeVoiceURI = '';
  private generation = 0;
  private pending = false;
  private cancelTimer?: () => void;
  constructor(private readonly port: SpeechPort, private readonly changed: (state: AudioState) => void) { this.refresh(); }
  refresh(): void {
    let voices: JapaneseVoice[] = [];
    try { if (this.port.supported) voices = this.port.voices(); } catch { /* Voice discovery can be temporarily unavailable. */ }
    if (this.pending && !voices.some(voice => voice.voiceURI === this.activeVoiceURI && /^ja(?:[-_]|$)/i.test(voice.lang))) this.stop();
    this.voice = japaneseVoice(voices);
    this.publish({...this.state, supported: this.port.supported, available: !!this.voice,
      localVoice: this.pending ? this.state.localVoice : !!this.voice?.localService});
  }
  play(owner: string, word: AudioWord, reading: string, rate: WordAudioRate): void {
    if (!word.readings.includes(reading) || ![1, 0.75].includes(rate)) return;
    this.stop(); this.refresh();
    const voice = this.voice;
    if (!voice) {
      this.publish({...this.state, owner, phase: 'error', message: this.port.supported
        ? 'No Japanese voice is available. Add a Japanese voice in your device settings, then refresh audio.'
        : 'Pronunciation audio is unavailable in this browser.'});
      return;
    }
    const generation = ++this.generation;
    this.pending = true; this.activeVoiceURI = voice.voiceURI;
    const current = (): boolean => this.pending && generation === this.generation;
    const failed = (): void => {
      if (!current()) return;
      this.stop(); this.publish({...this.state, owner, phase: 'error', message: 'Audio could not finish. Try playing the word again.'});
    };
    this.publish({...this.state, owner, phase: 'starting', localVoice: voice.localService, message: 'Starting pronunciation…'});
    this.cancelTimer = this.port.later(failed, 15000);
    try {
      this.port.speak({text: reading, voice, rate}, {
        start: () => {
          if (!current()) return;
          this.cancelTimer?.(); this.cancelTimer = this.port.later(failed, 30000);
          this.publish({...this.state, phase: 'speaking', message: rate === 1 ? 'Playing pronunciation…' : 'Playing slowly…'});
        },
        end: () => {
          if (!current()) return;
          this.cancelTimer?.(); this.cancelTimer = undefined; this.pending = false; this.generation++;
          this.publish({...this.state, phase: 'idle', message: 'Pronunciation finished.'});
        },
        error: failed
      });
    } catch { failed(); }
  }
  stop(owner?: string): void {
    if (owner !== undefined && this.state.owner !== owner) return;
    const cancel = this.pending;
    this.pending = false; this.generation++; this.cancelTimer?.(); this.cancelTimer = undefined;
    if (cancel) { try { this.port.cancel(); } catch { /* UI must still recover from a platform cancellation failure. */ } }
    this.publish({...this.state, owner: null, phase: 'idle', message: ''});
  }
  private publish(state: AudioState): void { this.state = state; this.changed({...state}); }
}
