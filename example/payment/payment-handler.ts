import type { ImplScan } from '../../src/index.ts';

export interface PaymentHandler extends ImplScan {
  name: string;
  pay(amount: number): string;
}
