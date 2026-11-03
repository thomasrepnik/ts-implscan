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
then you have to register every implementation by hand, and it's easy to forget one.

`ts-implscan` moves the scan to build time. A small [ts-morph](https://ts-morph.com) script reads
your source code and generates a typed registry file. For Angular, it also generates one
`InjectionToken` per interface and all the providers.

## How it works

1. Mark an interface by extending the `ImplScan` marker interface. It's the same idea as a Java
   marker interface such as `Serializable`:
   ```ts
   export interface PaymentHandler extends ImplScan {
     name: string;
     pay(amount: number): string;
   }
   ```
2. Write implementations as usual:
   ```ts
   export class CardHandler implements PaymentHandler { ... }
   ```
3. The generator finds every exported class that `implements` a marked interface and writes:
   ```ts
   // src/generated/registry.ts – GENERATED, do not edit
   export const PaymentHandlerImplementations: Array<new (...args: any[]) => PaymentHandler> = [CardHandler, PaypalHandler, TwintHandler];
   ```
   With `--target angular` it also writes:
   ```ts
   export const PAYMENT_HANDLER_LIST = new InjectionToken<PaymentHandler[]>('PAYMENT_HANDLER_LIST');

   export function provideImplscan(): Provider[] {
     return [
       { provide: PAYMENT_HANDLER_LIST, useClass: CardHandler, multi: true },
       ...
     ];
   }
   ```

To add an implementation, write a new class and regenerate. To add an interface, extend
`ImplScan`, and its token and providers are generated too. With 10 interfaces you still write zero
tokens and zero provider entries by hand.

Why a marker interface rather than a comment tag like `/** @implscan */`? The marker is
checked by the compiler, so a typo doesn't silently drop the interface. Your IDE's "Find usages"
on `ImplScan` lists every collected interface, renames are safe, and it has no runtime cost
(`ImplScan` has no members). It also keeps out the interfaces you implement for other reasons,
such as Angular's `OnInit`.

## When it's helpful

- **Plugin and strategy patterns**, such as payment providers, exporters, validators, notification
  channels or feature handlers, where the set of implementations keeps growing.
- **Teams coming from Spring or Java** who want the open/closed principle that `List<A>` injection
  gives them: adding behaviour means adding a class, not editing a central list.
- **Angular apps** with many multi-provider tokens, so nobody forgets to register a new
  implementation, or to write the token.
- **Anywhere you want it checked at compile time.** The registry is ordinary TypeScript, so `tsc`
  fails if a listed class doesn't actually satisfy the interface.

It's probably overkill if you have two implementations that rarely change. A hand-written array
is fine then.

## Try it

You need Node 22.18 or newer, which runs `.ts` files directly.

```sh
npm install
npm run generate:dry           # print the plain registry, write nothing
npm run generate:dry:angular   # print the Angular registry (tokens + providers), write nothing
npm start                      # regenerate, then run the demo with plain arrays
npm run start:angular          # regenerate, then resolve everything through Angular's real Injector
```

The demo has two marked interfaces, `PaymentHandler` (3 implementations) and `Notifier`
(2 implementations). Add a new class that `implements PaymentHandler` anywhere under `src/`,
run `npm start` again, and it shows up.

`@angular/core` and `rxjs` are dev dependencies only so that `start:angular` can run Angular's
injector in Node. The generator itself only needs `ts-morph`.

### Generator options

```sh
node scripts/generate-registry.ts [--project tsconfig.json] [--src src] [--out src/generated/registry.ts] [--target plain|angular] [--dry-run]
```

| Option      | Default                     | Meaning                                                      |
|-------------|-----------------------------|--------------------------------------------------------------|
| `--project` | `tsconfig.json`             | tsconfig to read compiler options from (paths, resolution)     |
| `--src`     | `src`                       | Folder to scan. `*.spec.ts` and `*.d.ts` are skipped.          |
| `--out`     | `src/generated/registry.ts` | File to generate                                             |
| `--target`  | `plain`                     | `angular` adds an `InjectionToken` per interface and `provideImplscan()` |
| `--dry-run` | off                         | Print the result to stdout instead of writing it             |

The import extension follows your tsconfig: `.ts` with `allowImportingTsExtensions`, `.js` with
`NodeNext`, and no extension with `bundler` (Angular).

## Using it in Angular

The generator only runs at build time, so nothing from it ends up in your production bundle.

1. Install ts-morph as a dev dependency. Copy `scripts/generate-registry.ts` and `src/implscan.ts`
   (the marker) into your project:
   ```sh
   npm i -D ts-morph
   ```
2. Hook it into your scripts:
   ```json
   "generate": "node scripts/generate-registry.ts --target angular --project tsconfig.app.json --out src/app/generated/registry.ts",
   "prestart": "npm run generate",
   "prebuild": "npm run generate"
   ```
   On Node versions older than 22.18, run it with `npx tsx` instead of `node`.
3. Register all generated providers once:
   ```ts
   // app.config.ts
   import { provideImplscan } from './generated/registry';

   export const appConfig: ApplicationConfig = {
     providers: [provideImplscan()],
   };
   ```
4. Inject the list anywhere. This is the equivalent of Spring's `List<PaymentHandler>`:
   ```ts
   import { PAYMENT_HANDLER_LIST } from './generated/registry';

   private readonly handlers = inject(PAYMENT_HANDLER_LIST); // PaymentHandler[]
   ```

Implementations can use DI themselves, for example `private readonly http = inject(HttpClient)`.
Angular creates them through `useClass`, so `inject()` works inside them. Mark them with
`@Injectable()`, but **without** `providedIn: 'root'`: `useClass` creates its own instance, so a
root-provided class would exist twice.

In tests, replace a whole list with one provider:

```ts
providers: [{ provide: PAYMENT_HANDLER_LIST, useValue: [fakeHandler] }]
```

A marked interface without any implementation still gets a provider (`useValue: []`), so
injecting it returns an empty list instead of throwing.

### Without the generated tokens

`--target plain` only generates the arrays of classes. In that case:

- **Plain `new`:** `PaymentHandlerImplementations.map((C) => new C())`. This only works for
  handlers without dependencies. `inject()` outside a DI context throws `NG0203`.
- **Each class `providedIn: 'root'`**, and the consumer calls
  `PaymentHandlerImplementations.map((C) => inject(C))`. Dependencies work, but every consumer
  imports the generated file, and a test has to override each class one by one.

**In CI:** `prebuild` only runs through `npm run build`. If your pipeline calls `ng build`
directly, run `npm run generate` first. If you commit the generated file, add
`npm run generate && git diff --exit-code` to CI to catch a forgotten regeneration.

## Limits

- Only interfaces that extend `ImplScan` **directly** are collected.
- Only explicit `implements X` clauses count. Classes that only match the interface structurally,
  and subclasses of an implementing class, are not found.
- Implementations must be exported, non-abstract, named-export classes. A non-exported
  implementation is skipped with a warning.
