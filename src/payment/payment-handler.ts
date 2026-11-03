import type { ImplScan } from '../implscan.ts';

export interface PaymentHandler extends ImplScan {
  name: string;
  pay(amount: number): string;
}
