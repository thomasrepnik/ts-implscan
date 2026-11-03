import { PaymentHandlerImplementations } from './generated/registry.ts';
import { PaymentService } from './payment/payment-service.ts';

const service = new PaymentService(PaymentHandlerImplementations.map((Impl) => new Impl()));
service.payWithAll(42);
