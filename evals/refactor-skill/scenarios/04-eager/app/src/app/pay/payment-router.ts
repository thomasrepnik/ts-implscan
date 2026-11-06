import { inject, Injectable, Injector } from '@angular/core';
import { Observable } from 'rxjs';
import { CardHandler } from './card-handler';
import { PaySettings } from './pay-settings';
import { PaypalHandler } from './paypal-handler';

@Injectable({ providedIn: 'root' })
export class PaymentRouter {
  private readonly injector = inject(Injector);
  private readonly settings = inject(PaySettings);

  pay(amount: number): Observable<string> {
    const handler = this.settings.method() === 'card' ? this.injector.get(CardHandler) : this.injector.get(PaypalHandler);
    return handler.pay(amount);
  }
}
