import { NotifierImplementations, PaymentHandlerDispatcher, PaymentHandlerImplementations } from './generated/implscan-registry.ts';
import type { PaymentContext } from './payment/payment-context.ts';
import { PaymentService } from './payment/payment-service.ts';

const handlers = PaymentHandlerImplementations.map((Impl) => new Impl());

// List<PaymentHandler>: every implementation
const service = new PaymentService(handlers);
service.payWithAll(42);

// Dispatcher: the one implementation applicable to the current context, chosen on every call
let method: PaymentContext['method'] = 'twint';
const payment = new PaymentHandlerDispatcher(handlers, () => ({ method }));
console.log(payment.pay(42));
method = 'card'; // CardHandler wins over PaypalHandler by priority
console.log(payment.pay(42));
payment.receipt(42).subscribe((line) => console.log(line));

for (const notifier of NotifierImplementations.map((Impl) => new Impl())) {
  console.log(notifier.notify('payment done'));
}
