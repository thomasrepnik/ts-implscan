import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CurrencySettings {
  readonly currency = signal<'CHF' | 'EUR'>('CHF');
}
