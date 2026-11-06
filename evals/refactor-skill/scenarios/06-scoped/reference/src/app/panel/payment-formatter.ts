import type { Dispatchable } from '@thomasrepnik/ts-implscan';

export interface PanelContext {
  method: 'card' | 'twint';
}

export interface PaymentFormatter extends Dispatchable<PanelContext> {
  format(amount: number): string;
}
