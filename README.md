# ts-implscan

[![npm](https://img.shields.io/npm/v/@thomasrepnik/ts-implscan)](https://www.npmjs.com/package/@thomasrepnik/ts-implscan)
[![CI](https://github.com/thomasrepnik/ts-implscan/actions/workflows/ci.yml/badge.svg)](https://github.com/thomasrepnik/ts-implscan/actions/workflows/ci.yml)

**Spring-style `List<A>` injection for TypeScript.** Find every `implements A` and generate the registry.

## Installation

```sh
npm install --save-dev @thomasrepnik/ts-implscan
```

The package contains two things:

| What | How you use it |
|---|---|
| The `ImplScan` marker interface | `import type { ImplScan } from '@thomasrepnik/ts-implscan'` |
| The `ts-implscan` CLI (the generator) | `npx ts-implscan`, or in a `package.json` script |

It's a dev dependency because it only runs at build time. The `ImplScan` import is type-only and
disappears when compiled, so nothing from this package ends up in your production bundle.
You need Node 22 or newer.

## Quick start

1. **Mark an interface** by extending `ImplScan`:
   ```ts
   import type { ImplScan } from '@thomasrepnik/ts-implscan';

   export interface PaymentHandler extends ImplScan {
     name: string;
     pay(amount: number): string;
   }
   ```
2. **Write implementations** as usual, anywhere under `src/`:
   ```ts
   export class CardHandler implements PaymentHandler { ... }
   export class PaypalHandler implements PaymentHandler { ... }
   ```
3. **Generate the registry**, ideally before every start and build:
   ```json
   "scripts": {
     "generate": "ts-implscan --target angular",
     "prestart": "npm run generate",
     "prebuild": "npm run generate"
   }
   ```
4. **Use it.** In Angular, register everything once and inject the list anywhere:
   ```ts
   // app.config.ts
   import { provideImplscan } from './generated/registry';
   export const appConfig: ApplicationConfig = { providers: [provideImplscan()] };

   // any component or service: the equivalent of Spring's List<PaymentHandler>
   import { PAYMENT_HANDLER_LIST } from './generated/registry';
   private readonly handlers = inject(PAYMENT_HANDLER_LIST); // PaymentHandler[]
   ```

A new implementation is picked up the next time you regenerate. A new interface only needs
`extends ImplScan`; its token and providers are generated too.

## Why

In Spring you can inject `List<PaymentHandler>`, and the container hands you every bean that
implements the interface. TypeScript can't do this out of the box, for two reasons:

1. **Interfaces are erased.** At runtime nothing records that a class implements `PaymentHandler`.
2. **There is no classpath scanning.** JavaScript only runs files that something imports, so a
   new implementation that nobody imports doesn't exist at runtime.

DI containers such as Angular, tsyringe or InversifyJS solve this with injection tokens, but
then you have to register every implementation by hand, and it's easy to forget one.

`ts-implscan` moves the scan to build time. It uses [ts-morph](https://ts-morph.com) and the
TypeScript type checker to find every exported class that `implements` a marked interface, and
writes a typed registry file:

```ts
// src/generated/registry.ts – GENERATED, do not edit
export const PaymentHandlerImplementations: Array<new (...args: any[]) => PaymentHandler> = [CardHandler, PaypalHandler];

// only with --target angular
export const PAYMENT_HANDLER_LIST = new InjectionToken<PaymentHandler[]>('PAYMENT_HANDLER_LIST');

export function provideImplscan(): Provider[] {
  return [
    { provide: PAYMENT_HANDLER_LIST, useClass: CardHandler, multi: true },
    { provide: PAYMENT_HANDLER_LIST, useClass: PaypalHandler, multi: true },
  ];
}
```

The registry is ordinary TypeScript, so `tsc` fails if a listed class doesn't actually satisfy
its interface.

**Why a marker interface rather than a comment tag like `/** @implscan */`?** The marker is
checked by the compiler, so a typo doesn't silently drop the interface. Your IDE's "Find usages"
on `ImplScan` lists every collected interface, and renames are safe. It's the same idea as a Java
marker interface such as `Serializable`, and it keeps out the interfaces you implement for other
reasons, such as Angular's `OnInit`.

## When it's helpful

- **Plugin and strategy patterns**, such as payment providers, exporters, validators, notification
  channels or feature handlers, where the set of implementations keeps growing.
- **Teams coming from Spring or Java** who want the open/closed principle that `List<A>` injection
  gives them: adding behaviour means adding a class, not editing a central list.
- **Angular apps** with many multi-provider tokens, so nobody forgets to register a new
  implementation, or to write the token.

It's probably overkill if you have two implementations that rarely change. A hand-written array
is fine then.

## CLI options

```sh
ts-implscan [--project tsconfig.json] [--src src] [--out src/generated/registry.ts] [--target plain|angular] [--dry-run]
```

| Option      | Default                     | Meaning                                                      |
|-------------|-----------------------------|--------------------------------------------------------------|
| `--project` | `tsconfig.json`             | tsconfig to read compiler options from (paths, resolution)     |
| `--src`     | `src`                       | Folder to scan. `*.spec.ts` and `*.d.ts` are skipped.          |
| `--out`     | `src/generated/registry.ts` | File to generate                                             |
| `--target`  | `plain`                     | `angular` adds an `InjectionToken` per interface and `provideImplscan()` |
| `--dry-run` | off                         | Print the result to stdout instead of writing it             |
| `-h, --help`|                             | Show the help                                                |

Use `--dry-run` to check which classes would be collected, without writing anything.

The files to scan come from `--src`, not from the tsconfig, because a new implementation isn't
imported anywhere yet. The tsconfig is only read for compiler options. The import extension in
the generated file follows it too: `.ts` with `allowImportingTsExtensions`, `.js` with `NodeNext`,
and no extension with `bundler`, which is what Angular uses.

## Angular

A typical setup in an Angular CLI project:

```json
"generate": "ts-implscan --target angular --project tsconfig.app.json --out src/app/generated/registry.ts"
```

- **Implementations can use DI themselves**, for example `private readonly http = inject(HttpClient)`.
  Angular creates them through `useClass`, so `inject()` works inside them.
- **Mark them with `@Injectable()`, but without `providedIn: 'root'`.** `useClass` creates its own
  instance, so a root-provided class would exist twice.
- **In tests, replace a whole list** with one provider:
  `providers: [{ provide: PAYMENT_HANDLER_LIST, useValue: [fakeHandler] }]`.
- **A marked interface without any implementation** still gets a provider (`useValue: []`), so
  injecting it returns an empty list instead of throwing.

### Without the generated tokens (`--target plain`)

The plain target only generates the arrays of classes, with no Angular dependency. You can use
it with any framework, or none at all:

- **Plain `new`:** `PaymentHandlerImplementations.map((C) => new C())`. This only works for
  classes without dependencies. In Angular, `inject()` outside a DI context throws `NG0203`.
- **Angular, each class `providedIn: 'root'`**, and the consumer calls
  `PaymentHandlerImplementations.map((C) => inject(C))`. Dependencies work, but every consumer
  imports the generated file, and a test has to override each class one by one.

## In CI

`prebuild` only runs through `npm run build`. If your pipeline calls `ng build` directly, run
`npm run generate` first.

Commit the generated file, so the IDE and type checks work right after a checkout. Then let CI
catch a forgotten regeneration:

```sh
npm run generate && git diff --exit-code
```

## Limits

- Only interfaces that extend `ImplScan` **directly** are collected. The CLI detects the marker by
  its name, so a local `interface ImplScan {}` works too.
- Only explicit `implements X` clauses count. Classes that only match the interface structurally,
  and subclasses of an implementing class, are not found.
- Implementations must be exported, non-abstract, named-export classes. A non-exported
  implementation is skipped with a warning.

## Development

This repository contains the library in `src/` and a runnable demo in `example/`. The demo has
two marked interfaces, `PaymentHandler` and `Notifier`.

```sh
npm install
npm run generate:dry           # print the plain registry for the example, write nothing
npm run generate:dry:angular   # the same with Angular tokens and providers
npm start                      # regenerate, then run the example with plain arrays
npm run start:angular          # regenerate, then resolve everything through Angular's real Injector
npm run typecheck
npm run test:package           # pack, install into an empty project, run the CLI from there
```

`@angular/core` and `rxjs` are dev dependencies only so that `start:angular` can run Angular's
injector in Node. The published package only depends on `ts-morph`.

### Releasing

Releases are published to npm by `.github/workflows/release.yml`, using npm
[trusted publishing](https://docs.npmjs.com/trusted-publishers). It doesn't need an npm token.

```sh
npm version minor            # or patch / major: bumps package.json, commits and tags vX.Y.Z
git push --follow-tags
gh release create v0.2.0 --generate-notes   # or click "Publish release" on GitHub
```

Publishing the GitHub release starts the workflow. It checks that the tag matches
`package.json`, type-checks, runs the package smoke test and publishes.

## License

[MIT](LICENSE)
