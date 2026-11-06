import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PaySettings {
  readonly method = signal<'card' | 'paypal'>('card');
}
