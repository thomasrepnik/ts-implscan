import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ActiveFlow {
  readonly method = signal<'card' | 'paypal' | undefined>(undefined);
}
