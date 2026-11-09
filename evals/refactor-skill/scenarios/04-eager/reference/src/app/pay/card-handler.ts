import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import type { PayContext, PaymentHandler } from './payment-handler';

@Injectable()
export class CardHandler implements PaymentHandler {
  isApplicableTo(context: PayContext): boolean {
    return context.method === 'card';
  }

  pay(amount: number): Observable<string> {
    return of(`card:${amount}`);
  }
}
