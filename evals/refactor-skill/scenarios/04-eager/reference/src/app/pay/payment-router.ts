import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PaymentHandlerDispatcher } from '../generated/implscan-registry';

@Injectable({ providedIn: 'root' })
export class PaymentRouter {
  private readonly handler = inject(PaymentHandlerDispatcher);

  pay(amount: number): Observable<string> {
    return this.handler.pay(amount);
  }
}
