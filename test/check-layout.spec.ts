import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';

const script = resolve('skills/ts-implscan-refactor/check-layout.mjs');

const VALID: Record<string, string> = {
  'src/app/payment/context/api/payment-context.ts': `export interface PaymentContext { method: string }`,
  'src/app/payment/context/impl/payment-context.provider.ts': `export class PaymentContextProvider implements DispatchContextProvider<PaymentContext> { get() { return { method: 'card' }; } }`,
  'src/app/payment/handlers/api/payment-handler.ts': `export interface PaymentHandler extends Dispatchable<PaymentContext> { pay(): string }`,
  'src/app/payment/handlers/impl/card-payment.service.ts': `export class CardPaymentService implements PaymentHandler {}`,
  'src/app/payment/handlers/impl/twint-payment.service.ts': `export class TwintPaymentService implements PaymentHandler {}`,
  'src/app/settings/payment-settings.ts': `export class PaymentSettings {}`,
};

function check(files: Record<string, string>, change?: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), 'layout-'));
  try {
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(join(root, path)), { recursive: true });
      writeFileSync(join(root, path), text);
    }
    change?.(root);
    const result = spawnSync(process.execPath, [script, root], { cwd: root, encoding: 'utf8' });
    return { status: result.status, output: result.stdout + result.stderr };
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test('accepts the documented layout', () => {
  const { status, output } = check(VALID);
  assert.equal(status, 0, output);
  assert.match(output, /layout ok: PaymentHandler/);
});

const broken: Array<[string, (root: string) => void, RegExp]> = [
  ['an interface outside handlers/api', (r) => renameSync(join(r, 'src/app/payment/handlers/api/payment-handler.ts'), join(r, 'src/app/payment/handlers/payment-handler.ts')), /interface must be in/],
  ['a missing context file', (r) => rmSync(join(r, 'src/app/payment/context/api/payment-context.ts')), /missing .*payment-context\.ts/],
  ['a provider in the wrong folder', (r) => renameSync(join(r, 'src/app/payment/context/impl/payment-context.provider.ts'), join(r, 'src/app/payment/context/api/payment-context.provider.ts')), /missing .*impl\/payment-context\.provider\.ts/],
  ['an implementation outside handlers/impl', (r) => renameSync(join(r, 'src/app/payment/handlers/impl/card-payment.service.ts'), join(r, 'src/app/payment/handlers/card-payment.service.ts')), /CardPaymentService must be in/],
  ['an implementation named differently', (r) => writeFileSync(join(r, 'src/app/payment/handlers/impl/card-payment.service.ts'), 'export class CardHandler implements PaymentHandler {}'), /must be named <Variant>PaymentService/],
  ['a second export in the context file', (r) => writeFileSync(join(r, 'src/app/payment/context/api/payment-context.ts'), 'export interface PaymentContext {}\nexport type Method = string;'), /holds only PaymentContext/],
  ['an unrelated file in a layout folder', (r) => writeFileSync(join(r, 'src/app/payment/handlers/impl/helper.ts'), 'export const helper = 1;'), /unexpected file/],
  ['another class in the feature folder', (r) => writeFileSync(join(r, 'src/app/payment/payment-settings.ts'), 'export class PaymentSettings {}'), /holds only context\/, handlers\/ and shared\//],
  ['a feature folder nested below src/app', (r) => { mkdirSync(join(r, 'src/app/shop')); renameSync(join(r, 'src/app/payment'), join(r, 'src/app/shop/payment')); }, /directly under src\/app/],
  ['an interface not named <Feature>Handler', (r) => writeFileSync(join(r, 'src/app/payment/handlers/api/payment-handler.ts'), 'export interface PaymentFlow extends Dispatchable<PaymentContext> {}'), /name it <Feature>Handler/],
];

for (const [name, change, expected] of broken) {
  test(`rejects ${name}`, () => {
    const { status, output } = check(VALID, change);
    assert.equal(status, 1, output);
    assert.match(output, expected);
  });
}

test('shared code may sit in shared/, including an abstract base class', () => {
  const { status, output } = check(VALID, (r) => {
    mkdirSync(join(r, 'src/app/payment/shared'));
    writeFileSync(join(r, 'src/app/payment/shared/format-amount.ts'), 'export function formatAmount() {}');
    writeFileSync(join(r, 'src/app/payment/shared/base-payment.ts'), 'export abstract class BasePayment implements PaymentHandler {}');
  });
  assert.equal(status, 0, output);
});

test('specs may sit beside the class they test', () => {
  const { status, output } = check(VALID, (r) => writeFileSync(join(r, 'src/app/payment/handlers/impl/card-payment.service.spec.ts'), ''));
  assert.equal(status, 0, output);
});

test('accepts implementations with and without getPriority', () => {
  const { status, output } = check(VALID, (r) => {
    writeFileSync(
      join(r, 'src/app/payment/handlers/impl/card-payment.service.ts'),
      `export class CardPaymentService implements PaymentHandler {\n  isApplicableTo(context: PaymentContext) { return context.method === 'card'; }\n  getPriority() { return 10; }\n  pay() { return 'card'; }\n}`,
    );
    writeFileSync(
      join(r, 'src/app/payment/handlers/impl/twint-payment.service.ts'),
      `export class TwintPaymentService implements PaymentHandler {\n  isApplicableTo() { return true; }\n  pay() { return 'twint'; }\n}`,
    );
  });
  assert.equal(status, 0, output);
  assert.match(output, /layout ok: PaymentHandler/);
});
