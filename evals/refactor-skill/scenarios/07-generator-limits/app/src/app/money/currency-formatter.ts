import type { Dispatchable } from '@thomasrepnik/ts-implscan';

export interface CurrencyContext {
  currency: 'CHF' | 'EUR';
}

export interface CurrencyFormatter extends Dispatchable<CurrencyContext> {
  format(amount: number): string;
}
