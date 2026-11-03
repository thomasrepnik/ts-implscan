import type { PaymentHandler } from './payment-handler.ts';

export class PaypalHandler implements PaymentHandler {
  name = 'paypal';
  pay(amount: number) {
    return `sent ${amount} via PayPal`;
  }
}
