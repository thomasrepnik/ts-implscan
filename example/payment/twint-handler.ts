import type { PaymentHandler as Handler } from './payment-handler.ts';

export class TwintHandler implements Handler {
  name = 'twint';
  pay(amount: number) {
    return `paid ${amount} with TWINT`;
  }
}
