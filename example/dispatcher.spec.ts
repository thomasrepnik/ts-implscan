// Runs against the generated plain dispatcher; `.spec.ts` keeps the fakes out of the scan.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { of } from 'rxjs';
import { PaymentHandlerDispatcher } from './generated/implscan-registry.ts';
import type { PaymentContext } from './payment/payment-context.ts';
import type { PaymentHandler } from './payment/payment-handler.ts';

function fake(name: string, applicable: (context: PaymentContext) => boolean, priority: number): PaymentHandler {
  return {
    name,
    isApplicableTo: applicable,
    getPriority: () => priority,
    pay: (amount) => `${name}:${amount}`,
    receipt() {
      return of(this.name);
    },
  };
}

test('throws when nothing is applicable, at the first call not at construction', () => {
  const d = new PaymentHandlerDispatcher([fake('a', () => false, 0)], () => ({ method: 'card' }));
  assert.throws(
    () => d.pay(1),
    /\[PaymentHandlerDispatcher\] No applicable implementation for context=\{"method":"card"\}\. Available=Object\(priority=0\)/,
  );
});

test('throws with an empty list', () => {
  const d = new PaymentHandlerDispatcher([], () => ({ method: 'card' }));
  assert.throws(() => d.pay(1), /No applicable implementation.*Available=$/);
});

test('uses the only applicable implementation even with a lower priority', () => {
  const d = new PaymentHandlerDispatcher(
    [fake('low', (c) => c.method === 'card', 0), fake('high', () => false, 9)],
    () => ({ method: 'card' }),
  );
  assert.equal(d.pay(5), 'low:5');
});

test('highest priority wins among several applicable', () => {
  const d = new PaymentHandlerDispatcher([fake('a', () => true, 1), fake('b', () => true, 2)], () => ({ method: 'card' }));
  assert.equal(d.pay(5), 'b:5');
});

test('tie for highest throws Ambiguous', () => {
  const d = new PaymentHandlerDispatcher([fake('a', () => true, 1), fake('b', () => true, 1)], () => ({ method: 'card' }));
  assert.throws(() => d.pay(5), /Ambiguous implementations.*HighestPriority=1/);
});

test('resolves again on every call', () => {
  let method: PaymentContext['method'] = 'card';
  const d = new PaymentHandlerDispatcher(
    [fake('card', (c) => c.method === 'card', 0), fake('twint', (c) => c.method === 'twint', 0)],
    () => ({ method }),
  );
  assert.equal(d.pay(1), 'card:1');
  method = 'twint';
  assert.equal(d.pay(1), 'twint:1');
});

test('forwards arguments, properties, property writes and the marker methods', () => {
  const impl = fake('a', () => true, 3);
  const d = new PaymentHandlerDispatcher([impl], () => ({ method: 'card' }));
  assert.equal(d.name, 'a');
  d.name = 'renamed';
  assert.equal(impl.name, 'renamed');
  assert.equal(d.getPriority(), 3);
  assert.equal(d.isApplicableTo({ method: 'twint' }), true);
  let received = '';
  d.receipt(7).subscribe((value) => (received = value));
  assert.equal(received, 'renamed');
});

test('a circular context still yields the No applicable error', () => {
  const ctx: PaymentContext & { self?: unknown } = { method: 'card' };
  ctx.self = ctx;
  const d = new PaymentHandlerDispatcher([], () => ctx);
  assert.throws(() => d.pay(1), /No applicable implementation for context=\[object Object\]/);
});
