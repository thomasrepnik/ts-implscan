import { inject } from '@angular/core';
import type { DispatchContextProvider } from '../../src/index.ts';
import type { PaymentContext } from './payment-context.ts';
import { PAYMENT_SETTINGS } from './payment-settings.ts';

// Found by the scan: provideImplscan() builds PAYMENT_HANDLER_CONTEXT from it.
export class PaymentContextProvider implements DispatchContextProvider<PaymentContext> {
  private readonly settings = inject(PAYMENT_SETTINGS);

  get(): PaymentContext {
    return { method: this.settings.method };
  }
}
