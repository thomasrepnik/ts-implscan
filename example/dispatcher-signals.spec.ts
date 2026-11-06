// Runs against the generated Angular dispatcher: it reads its context on every call without
// caching, so a signal read by the context provider is tracked by the caller.
import { computed, Injector, signal } from '@angular/core';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PaymentHandlerDispatcher, provideImplscan, RECEIPT_FORMATTER_LIST, ReceiptFormatterDispatcher } from './generated/implscan-registry.angular.ts';
import type { PaymentContext } from './payment/payment-context.ts';
import { PAYMENT_SETTINGS, type PaymentSettings } from './payment/payment-settings.ts';

// The real PaymentContextProvider reads `settings.method`, here backed by a signal.
function paymentDispatcher(initial: string) {
  const method = signal(initial);
  const state = { reads: 0 };
  const settings: PaymentSettings = {
    get method() {
      state.reads++;
      return method() as PaymentContext['method'];
    },
  };
  const injector = Injector.create({ providers: [...provideImplscan(), { provide: PAYMENT_SETTINGS, useValue: settings }] });
  return { dispatcher: injector.get(PaymentHandlerDispatcher), method, state };
}

test('a computed follows a signal-backed context and reads it only when the signal changes', () => {
  const { dispatcher, method, state } = paymentDispatcher('card');
  const name = computed(() => dispatcher.name);
  assert.equal(name(), 'card');

  const reads = state.reads;
  for (let i = 0; i < 10; i++) name();
  assert.equal(state.reads, reads);

  method.set('twint');
  assert.equal(name(), 'twint');
});

test('a computed recovers once the signal-backed context has an applicable implementation again', () => {
  const { dispatcher, method } = paymentDispatcher('card');
  const name = computed(() => dispatcher.name);
  assert.equal(name(), 'card');

  method.set('unknown');
  assert.throws(() => name(), /No applicable implementation/);

  method.set('paypal');
  assert.equal(name(), 'paypal');
});

test('a computed follows a signal read in isApplicableTo of a context-free dispatcher', () => {
  const format = signal('md');
  const formatter = (name: string) => ({
    isApplicableTo: () => format() === name,
    getPriority: () => 0,
    format: () => name,
  });
  const injector = Injector.create({
    providers: [
      { provide: RECEIPT_FORMATTER_LIST, useValue: [formatter('md'), formatter('plain')] },
      { provide: ReceiptFormatterDispatcher, useClass: ReceiptFormatterDispatcher },
    ],
  });
  const dispatcher = injector.get(ReceiptFormatterDispatcher);
  const receipt = computed(() => dispatcher.format([]));
  assert.equal(receipt(), 'md');

  format.set('plain');
  assert.equal(receipt(), 'plain');
});
