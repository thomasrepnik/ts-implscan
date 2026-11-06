import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PaypalHandler {
  private readonly session$ = inject(HttpClient).get<{ token: string }>('/api/paypal/session').pipe(shareReplay(1));

  constructor() {
    this.session$.subscribe();
  }

  pay(amount: number): Observable<string> {
    return this.session$.pipe(map(({ token }) => `paypal:${amount}:${token}`));
  }
}
