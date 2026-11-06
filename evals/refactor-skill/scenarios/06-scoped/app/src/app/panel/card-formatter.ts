import { inject, Injectable } from '@angular/core';
import { PanelState } from './panel-state';

@Injectable()
export class CardFormatter {
  private readonly state = inject(PanelState);

  format(amount: number): string {
    return `card#${this.state.count()}:${amount}`;
  }
}
