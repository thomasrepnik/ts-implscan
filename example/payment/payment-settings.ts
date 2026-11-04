import { InjectionToken } from '@angular/core';
import type { PaymentContext } from './payment-context.ts';

// App-owned settings; the only thing the Angular demo provides besides provideImplscan().
export interface PaymentSettings {
  method: PaymentContext['method'];
}

export const PAYMENT_SETTINGS = new InjectionToken<PaymentSettings>('PAYMENT_SETTINGS');
