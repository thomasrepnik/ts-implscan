import { inject, Injectable } from '@angular/core';
import { CardPaymentFlow } from './card-payment-flow';
import { CheckoutSettings } from './checkout-settings';
import { PaypalPaymentFlow } from './paypal-payment-flow';

@Injectable({ providedIn: 'root' })
export class PaymentSession {
  private readonly settings = inject(CheckoutSettings);
  private readonly card = inject(CardPaymentFlow);
  private readonly paypal = inject(PaypalPaymentFlow);
  private active: CardPaymentFlow | PaypalPaymentFlow | undefined;

  begin(amount: number): void {
    this.active = this.settings.method() === 'card' ? this.card : this.paypal;
    this.active.begin(amount);
  }

  addFee(fee: number): void {
    this.active?.addFee(fee);
  }

  summary(): string {
    return this.active?.summary() ?? 'none';
  }
}
