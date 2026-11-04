import { of } from 'rxjs';
import type { PaymentContext } from './payment-context.ts';
import type { PaymentHandler as Handler } from './payment-handler.ts';

export class TwintHandler implements Handler {
  name = 'twint';
  isApplicableTo(context: PaymentContext) {
    return context.method === 'twint';
  }
  getPriority() {
    return 0;
  }
  pay(amount: number) {
    return `paid ${amount} with TWINT`;
  }
  receipt(amount: number) {
    return of(`${this.name} receipt for ${amount}`);
  }
}
