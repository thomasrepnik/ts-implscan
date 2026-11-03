import type { PaymentHandler } from './payment-handler.ts';

export class CardHandler implements PaymentHandler {
  name = 'card';
  pay(amount: number) {
    return `charged ${amount} to credit card`;
  }
}
