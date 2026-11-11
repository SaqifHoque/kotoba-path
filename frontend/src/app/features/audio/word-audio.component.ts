import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AudioWord, WordAudioRate, audioWord } from './word-audio';
import { WordAudioService } from './word-audio.service';

let nextAudioControl = 0;
@Component({selector: 'app-word-audio', standalone: true, imports: [CommonModule, FormsModule],
  templateUrl: './word-audio.component.html', styleUrls: ['./word-audio.component.scss']})
export class WordAudioComponent implements OnChanges, OnDestroy {
  @Input() wordId = '';
  @Input() text = '';
  @Input() readings: string | readonly string[] = [];
  readonly owner = `word-audio-${++nextAudioControl}`;
  target: AudioWord | null = null;
  reading = '';
  private fingerprint = '';
  constructor(public readonly audio: WordAudioService) {}
  ngOnChanges(): void {
    const target = audioWord(this.wordId, this.text, this.readings), fingerprint = JSON.stringify(target);
    if (fingerprint === this.fingerprint) return;
    this.audio.stop(this.owner); this.fingerprint = fingerprint; this.target = target;
    if (!target?.readings.includes(this.reading)) this.reading = target?.readings[0] ?? '';
  }
  play(rate: WordAudioRate): void { if (this.target) this.audio.play(this.owner, this.target, this.reading, rate); }
  ngOnDestroy(): void { this.audio.stop(this.owner); }
}
