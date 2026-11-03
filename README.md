# ts-implscan

**Spring-style `List<A>` injection for TypeScript.** Find every `implements A` and generate the registry.

In Spring you can inject `List<PaymentHandler>`, and the container hands you every bean that
implements the interface. A new implementation is picked up automatically, without touching any
configuration.

TypeScript can't do this out of the box, for two reasons:

1. **Interfaces are erased.** At runtime nothing records that a class implements `PaymentHandler`.
2. **There is no classpath scanning.** JavaScript only runs files that something imports, so a
   new implementation that nobody imports doesn't exist at runtime.

DI containers such as Angular, tsyringe or InversifyJS solve this with injection tokens, but
then you have to list every implementation by hand, and it's easy to forget one.

`ts-implscan` moves the scan to build time. A small [ts-morph](https://ts-morph.com) script reads
your source code, finds every exported class with an explicit `implements X` clause, and generates
a typed registry file:

```ts
// src/generated/registry.ts – GENERATED, do not edit
import type { PaymentHandler } from '../payment/payment-handler.ts';
import { CardHandler } from '../payment/card-handler.ts';
import { PaypalHandler } from '../payment/paypal-handler.ts';
import { TwintHandler } from '../payment/twint-handler.ts';

export const PaymentHandlerImplementations: Array<new (...args: any[]) => PaymentHandler> = [CardHandler, PaypalHandler, TwintHandler];
```

To add an implementation, write a class that `implements PaymentHandler` and regenerate. Nothing
else changes.

## When it's helpful

- **Plugin and strategy patterns**, such as payment providers, exporters, validators, notification
  channels or feature handlers, where the set of implementations keeps growing.
- **Teams coming from Spring or Java** who want the open/closed principle that `List<A>` injection
  gives them: adding behaviour means adding a class, not editing a central list.
- **Angular apps** with `multi: true` providers, so you never forget to register a new
  implementation.
- **Anywhere you want it checked at compile time.** The registry is ordinary TypeScript, so `tsc`
  fails if a listed class doesn't actually satisfy the interface.

It's probably overkill if you have two implementations that rarely change. A hand-written array
is fine then.

## Try it

You need Node 22.18 or newer, which runs `.ts` files directly.

```sh
npm install
npm run generate:dry   # print what would be generated, write nothing
npm start              # regenerate the registry, then run the demo
```

The demo calls every `PaymentHandler` implementation found under `src/payment/`. Add a new file
there with a class that `implements PaymentHandler`, run `npm start` again, and it shows up.

### Generator options

```sh
node scripts/generate-registry.ts [--project tsconfig.json] [--src src] [--out src/generated/registry.ts] [--dry-run]
```

| Option      | Default                     | Meaning                                                   |
|-------------|-----------------------------|-----------------------------------------------------------|
| `--project` | `tsconfig.json`             | tsconfig to read compiler options from (paths, resolution)  |
| `--src`     | `src`                       | Folder to scan. `*.spec.ts` and `*.d.ts` are skipped.       |
| `--out`     | `src/generated/registry.ts` | File to generate                                          |
| `--dry-run` | off                         | Print the result to stdout instead of writing it          |

The import extension follows your tsconfig: `.ts` with `allowImportingTsExtensions`, `.js` with
`NodeNext`, and no extension with `bundler` (Angular).

## Using it in Angular

The generator only runs at build time, so nothing from it ends up in your production bundle.

1. Install ts-morph as a dev dependency, and copy `scripts/generate-registry.ts` into your
   project:
   ```sh
   npm i -D ts-morph
   ```
2. Hook it into your scripts:
   ```json
   "generate": "node scripts/generate-registry.ts --project tsconfig.app.json --out src/app/generated/registry.ts",
   "prestart": "npm run generate",
   "prebuild": "npm run generate"
   ```
   On Node versions older than 22.18, run it with `npx tsx` instead of `node`.
3. Register every implementation as a multi provider:
   ```ts
   // payment-handler.ts
   export interface PaymentHandler { name: string; pay(amount: number): string }
   export const PAYMENT_HANDLERS = new InjectionToken<PaymentHandler[]>('PAYMENT_HANDLERS');

   // app.config.ts
   import { PaymentHandlerImplementations } from './generated/registry';
   providers: [
     ...PaymentHandlerImplementations.map((useClass) => ({ provide: PAYMENT_HANDLERS, useClass, multi: true })),
   ]

   // anywhere: the equivalent of Spring's List<PaymentHandler>
   private readonly handlers = inject(PAYMENT_HANDLERS);
   ```
   Mark implementations with `@Injectable()` so they can use DI themselves.

**In CI:** `prebuild` only runs through `npm run build`. If your pipeline calls `ng build`
directly, run `npm run generate` first. If you commit the generated file, add
`npm run generate && git diff --exit-code` to CI to catch a forgotten regeneration.

## Limits

- Only explicit `implements X` clauses are found. Classes that only match the interface
  structurally, and subclasses of an implementing class, are not.
- Only exported, non-abstract, named-export classes are included.
