import { inject, Injectable } from '@angular/core';
import { PaymentFlowDispatcher } from '../generated/implscan-registry';
import { ActiveFlow } from './active-flow';
import { CheckoutSettings } from './checkout-settings';

@Injectable({ providedIn: 'root' })
export class PaymentSession {
  private readonly settings = inject(CheckoutSettings);
  private readonly active = inject(ActiveFlow);
  private readonly flow = inject(PaymentFlowDispatcher);

  begin(amount: number): void {
    this.active.method.set(this.settings.method());
    this.flow.begin(amount);
  }

  addFee(fee: number): void {
    if (this.active.method()) this.flow.addFee(fee);
  }

  summary(): string {
    return this.active.method() ? this.flow.summary() : 'none';
  }
}
