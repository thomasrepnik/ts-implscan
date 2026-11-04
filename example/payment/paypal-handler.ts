import { of } from 'rxjs';
import type { PaymentContext } from './payment-context.ts';
import type { PaymentHandler } from './payment-handler.ts';

export class PaypalHandler implements PaymentHandler {
  name = 'paypal';
  // PayPal can also process cards, but the dedicated CardHandler is preferred (higher priority).
  isApplicableTo(context: PaymentContext) {
    return context.method === 'paypal' || context.method === 'card';
  }
  getPriority() {
    return 0;
  }
  pay(amount: number) {
    return `paid ${amount} via PayPal`;
  }
  receipt(amount: number) {
    return of(`${this.name} receipt for ${amount}`);
  }
}
