// Same as main.ts, but resolved through Angular's real DI with the generated
// tokens and providers, exactly as `inject(PAYMENT_HANDLER_LIST)` or
// `inject(PaymentHandlerDispatcher)` would in an app. PAYMENT_HANDLER_CONTEXT
// is not provided here: provideImplscan() builds it from PaymentContextProvider.
import { Injector } from '@angular/core';
import {
  NOTIFIER_LIST,
  PAYMENT_HANDLER_LIST,
  PaymentHandlerDispatcher,
  provideImplscan,
  ReceiptFormatterDispatcher,
} from './generated/implscan-registry.angular.ts';
import { PAYMENT_SETTINGS, type PaymentSettings } from './payment/payment-settings.ts';
import { PaymentService } from './payment/payment-service.ts';

const settings: PaymentSettings = { method: 'twint' };
const injector = Injector.create({
  providers: [...provideImplscan(), { provide: PAYMENT_SETTINGS, useValue: settings }],
});

const service = new PaymentService(injector.get(PAYMENT_HANDLER_LIST));
service.payWithAll(42);

const payment = injector.get(PaymentHandlerDispatcher);
console.log(payment.pay(42));
settings.method = 'card';
console.log(payment.pay(42));

const receipt = injector.get(ReceiptFormatterDispatcher);
payment.receipt(42).subscribe((line) => console.log(receipt.format([line])));

for (const notifier of injector.get(NOTIFIER_LIST)) {
  console.log(notifier.notify('payment done'));
}
