// Same as main.ts, but resolved through Angular's real DI with the generated
// tokens and providers, exactly as `inject(PAYMENT_HANDLER_LIST)` or
// `inject(PaymentHandlerDispatcher)` would in an app.
import { Injector } from '@angular/core';
import {
  NOTIFIER_LIST,
  PAYMENT_HANDLER_CONTEXT,
  PAYMENT_HANDLER_LIST,
  PaymentHandlerDispatcher,
  provideImplscan,
} from './generated/implscan-registry.angular.ts';
import type { PaymentContext } from './payment/payment-context.ts';
import { PaymentService } from './payment/payment-service.ts';

let method: PaymentContext['method'] = 'twint';
const injector = Injector.create({
  providers: [...provideImplscan(), { provide: PAYMENT_HANDLER_CONTEXT, useValue: () => ({ method }) }],
});

const service = new PaymentService(injector.get(PAYMENT_HANDLER_LIST));
service.payWithAll(42);

const payment = injector.get(PaymentHandlerDispatcher);
console.log(payment.pay(42));
method = 'card';
console.log(payment.pay(42));
payment.receipt(42).subscribe((line) => console.log(line));

for (const notifier of injector.get(NOTIFIER_LIST)) {
  console.log(notifier.notify('payment done'));
}
