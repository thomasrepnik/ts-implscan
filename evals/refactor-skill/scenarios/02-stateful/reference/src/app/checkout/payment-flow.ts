import type { Dispatchable } from '@thomasrepnik/ts-implscan';

export interface ActiveFlowContext {
  method: 'card' | 'paypal' | undefined;
}

export interface PaymentFlow extends Dispatchable<ActiveFlowContext> {
  begin(amount: number): void;
  addFee(fee: number): void;
  summary(): string;
}
