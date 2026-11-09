import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import type { PayContext, PaymentHandler } from './payment-handler';

@Injectable()
export class PaypalHandler implements PaymentHandler {
  private readonly session$ = inject(HttpClient).get<{ token: string }>('/api/paypal/session').pipe(shareReplay(1));

  isApplicableTo(context: PayContext): boolean {
    return context.method === 'paypal';
  }

  pay(amount: number): Observable<string> {
    return this.session$.pipe(map(({ token }) => `paypal:${amount}:${token}`));
  }
}
