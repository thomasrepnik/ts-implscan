// Same as main.ts, but resolved through Angular's real DI with the generated
// tokens and providers, exactly as `inject(PAYMENT_HANDLER_LIST)` would in an app.
import { Injector } from '@angular/core';
import { NOTIFIER_LIST, PAYMENT_HANDLER_LIST, provideImplscan } from './generated/registry.angular.ts';
import { PaymentService } from './payment/payment-service.ts';

const injector = Injector.create({ providers: provideImplscan() });

const service = new PaymentService(injector.get(PAYMENT_HANDLER_LIST));
service.payWithAll(42);

for (const notifier of injector.get(NOTIFIER_LIST)) {
  console.log(notifier.notify('payment done'));
}
