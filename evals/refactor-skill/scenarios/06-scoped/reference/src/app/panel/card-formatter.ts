import { inject, Injectable } from '@angular/core';
import { PanelState } from './panel-state';
import type { PanelContext, PaymentFormatter } from './payment-formatter';

@Injectable()
export class CardFormatter implements PaymentFormatter {
  private readonly state = inject(PanelState);

  isApplicableTo(context: PanelContext): boolean {
    return context.method === 'card';
  }

  format(amount: number): string {
    return `card#${this.state.count()}:${amount}`;
  }
}
