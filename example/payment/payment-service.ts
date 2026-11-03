import type { PaymentHandler } from './payment-handler.ts';

export class PaymentService {
  private readonly handlers: PaymentHandler[];

  constructor(handlers: PaymentHandler[]) {
    this.handlers = handlers;
  }

  payWithAll(amount: number) {
    for (const handler of this.handlers) {
      console.log(`[${handler.name}] ${handler.pay(amount)}`);
    }
  }
}
