import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { PayContext, PaymentHandler } from './payment-handler';

@Injectable()
export class CardHandler implements PaymentHandler {
  isApplicableTo(context: PayContext): boolean {
    return context.method === 'card';
  }

  getPriority(): number {
    return 0;
  }

  pay(amount: number): Observable<string> {
    return of(`card:${amount}`);
  }
}
