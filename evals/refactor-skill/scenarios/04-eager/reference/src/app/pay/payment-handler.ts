import type { Dispatchable } from '@thomasrepnik/ts-implscan';
import type { Observable } from 'rxjs';

export interface PayContext {
  method: 'card' | 'paypal';
}

export interface PaymentHandler extends Dispatchable<PayContext> {
  pay(amount: number): Observable<string>;
}
