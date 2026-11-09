import { Injectable } from '@angular/core';
import type { ActiveFlowContext, PaymentFlow } from './payment-flow';

@Injectable()
export class PaypalPaymentFlow implements PaymentFlow {
  private amount = 0;

  isApplicableTo(context: ActiveFlowContext): boolean {
    return context.method === 'paypal';
  }

  begin(amount: number): void {
    this.amount = amount;
  }

  addFee(fee: number): void {
    this.amount += fee;
  }

  summary(): string {
    return `paypal:${this.amount}`;
  }
}
