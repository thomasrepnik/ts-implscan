import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CheckoutSettings {
  readonly method = signal<'card' | 'paypal'>('card');
}
