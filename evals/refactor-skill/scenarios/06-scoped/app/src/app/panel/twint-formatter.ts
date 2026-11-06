import { inject, Injectable } from '@angular/core';
import { PanelState } from './panel-state';

@Injectable()
export class TwintFormatter {
  private readonly state = inject(PanelState);

  format(amount: number): string {
    return `twint#${this.state.count()}:${amount}`;
  }
}
