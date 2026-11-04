#!/usr/bin/env bash
# Packs the library, installs the tarball into an empty Angular-style project
# (bundler resolution) and runs the CLI from it. This proves that everything a
# consumer needs (bin, compiled CLI, marker types, ts-morph) is in the package.
set -euo pipefail

root=$(pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

tarball=$(npm pack --silent --pack-destination "$tmp" | tail -1)
cd "$tmp"
npm init -y >/dev/null
npm install --silent --no-audit --no-fund "./$tarball"

mkdir -p src
cat > tsconfig.json <<'JSON'
{ "compilerOptions": { "module": "ES2022", "moduleResolution": "bundler", "strict": true } }
JSON
cat > src/greeter.ts <<'TS'
import type { ImplScan } from '@thomasrepnik/ts-implscan';
export interface Greeter extends ImplScan { greet(): string }
TS
cat > src/hello.ts <<'TS'
import type { Greeter } from './greeter';
export class Hello implements Greeter { greet() { return 'hello'; } }
TS
cat > src/payment.ts <<'TS'
import type { Dispatchable } from '@thomasrepnik/ts-implscan';
export interface PaymentContext { method: string }
export interface PaymentHandler extends Dispatchable<PaymentContext> { pay(amount: number): string }
TS
cat > src/card.ts <<'TS'
import type { PaymentContext, PaymentHandler } from './payment';
export class CardHandler implements PaymentHandler {
  isApplicableTo(context: PaymentContext) { return context.method === 'card'; }
  getPriority() { return 0; }
  pay(amount: number) { return `charged ${amount}`; }
}
TS

npx ts-implscan --target angular
out=src/generated/implscan-registry.ts
grep -q "import { Hello } from '../hello';" "$out"
grep -q "export const GREETER_LIST = new InjectionToken<Greeter\[\]>" "$out"
grep -q "{ provide: GREETER_LIST, useClass: Hello, multi: true }" "$out"
grep -q "export const PAYMENT_HANDLER_CONTEXT = new InjectionToken<() => PaymentContext>" "$out"
grep -q "export class PaymentHandlerDispatcher implements PaymentHandler {" "$out"
grep -q "  pay(amount: number): string {" "$out"
grep -q "{ provide: PaymentHandlerDispatcher, useClass: PaymentHandlerDispatcher }," "$out"
! grep -q "GreeterDispatcher" "$out"

echo "package smoke test passed ($tarball)"
