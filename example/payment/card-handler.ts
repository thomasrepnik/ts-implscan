import { of } from 'rxjs';
import type { PaymentContext } from './payment-context.ts';
import type { PaymentHandler } from './payment-handler.ts';

export class CardHandler implements PaymentHandler {
  name = 'card';
  isApplicableTo(context: PaymentContext) {
    return context.method === 'card';
  }
  getPriority() {
    return 10;
  }
  pay(amount: number) {
    return `charged ${amount} to credit card`;
  }
  receipt(amount: number) {
    return of(`${this.name} receipt for ${amount}`);
  }
}
