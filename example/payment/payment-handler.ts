import type { Observable } from 'rxjs';
import type { Dispatchable } from '../../src/index.ts';
import type { PaymentContext } from './payment-context.ts';

export interface PaymentHandler extends Dispatchable<PaymentContext> {
  name: string;
  pay(amount: number): string;
  receipt(amount: number): Observable<string>;
}
