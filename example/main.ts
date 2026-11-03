import { NotifierImplementations, PaymentHandlerImplementations } from './generated/implscan-registry.ts';
import { PaymentService } from './payment/payment-service.ts';

const service = new PaymentService(PaymentHandlerImplementations.map((Impl) => new Impl()));
service.payWithAll(42);

for (const notifier of NotifierImplementations.map((Impl) => new Impl())) {
  console.log(notifier.notify('payment done'));
}
