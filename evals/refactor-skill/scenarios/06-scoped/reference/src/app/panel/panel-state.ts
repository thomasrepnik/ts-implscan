import { Injectable, signal } from '@angular/core';

@Injectable()
export class PanelState {
  readonly method = signal<'card' | 'twint'>('card');
  readonly count = signal(0);
}
