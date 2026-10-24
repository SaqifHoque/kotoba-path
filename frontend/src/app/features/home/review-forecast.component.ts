import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ForecastBucket, ReviewForecast } from './review-forecast';

@Component({selector: 'app-review-forecast', standalone: true, imports: [CommonModule],
  templateUrl: './review-forecast.component.html', styleUrls: ['./review-forecast.component.scss']})
export class ReviewForecastComponent {
  @Input() forecast: ReviewForecast | null = null;
  range: 'hours' | 'days' = 'hours';
  get rows(): ForecastBucket[] { return this.forecast?.[this.range] ?? []; }
  get hasUpcoming(): boolean { return this.rows.some(row => row.counts.kanji || row.counts.vocabulary || row.counts.forge); }
}
