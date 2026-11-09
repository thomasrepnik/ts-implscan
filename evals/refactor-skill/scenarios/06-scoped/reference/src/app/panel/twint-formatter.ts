import { inject, Injectable } from '@angular/core';
import { PanelState } from './panel-state';
import type { PanelContext, PaymentFormatter } from './payment-formatter';

@Injectable()
export class TwintFormatter implements PaymentFormatter {
  private readonly state = inject(PanelState);

  isApplicableTo(context: PanelContext): boolean {
    return context.method === 'twint';
  }

  format(amount: number): string {
    return `twint#${this.state.count()}:${amount}`;
  }
}
