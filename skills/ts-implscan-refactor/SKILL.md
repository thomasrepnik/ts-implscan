---
name: ts-implscan-refactor
description: Use when refactoring existing Angular classes onto ts-implscan, introducing a Dispatchable, or replacing hand-written strategy selection with a generated dispatcher.
---

# Refactoring onto ts-implscan

Every refactor produces the same shape, so that a codebase with dozens of dispatchers reads as one.
Whether a dispatcher fits, and what the change could break, stay your judgement.

## Before you start

If `@thomasrepnik/ts-implscan` is not in `package.json`, install it first:

```sh
npm install --save-dev @thomasrepnik/ts-implscan
```

Then read `node_modules/@thomasrepnik/ts-implscan/README.md`. It documents the installed version, so
read it there and not on npm or GitHub.

## The shape

### Specs

Before changing the selection, extend the existing specs with one case per outcome of the old
selection: each implementation it can reach, each precedence between them, and each state before data
is available. They pass on the old code and stay in the repo after the refactor, because the compiler
checks none of what they cover.

### Files

Each `Dispatchable` gets a new feature folder directly under `src/app`, named after what is being
chosen, holding exactly this and nothing else. If that name is taken by an existing folder, use a more
specific one, as `receipt-export` for a taken `receipt`.

```
src/app/payment/
  context/
    api/payment-context.ts              PaymentContext
    impl/payment-context.provider.ts    PaymentContextProvider implements DispatchContextProvider<PaymentContext>
  handlers/
    api/payment-handler.ts              PaymentHandler extends Dispatchable<PaymentContext>
    impl/card-payment.service.ts        CardPaymentService implements PaymentHandler
    impl/twint-payment.service.ts       TwintPaymentService implements PaymentHandler
  shared/                               only when the implementations share code
```

The classes being chosen between are renamed and moved here, each file holding only the listed export,
with their own specs beside them. Code shared between the implementations goes in `shared/`. Every other
class, such as components, settings and stores, stays where it is.

### Priorities

`getPriority()` is optional and defaults to `0`. Leave it out wherever it would return `0`.

- The selection tests one value against a closed set, as a `switch` or ternary does: no
  implementation declares `getPriority()`.
- The conditions can overlap or a value can match nothing: the first branch gets the highest value, in
  steps of 10, down to `10`. A final `else` becomes an implementation without `getPriority()`, with
  `isApplicableTo()` returning `true`.

### The selecting class

If the class that held the selection would only forward to the dispatcher, delete it and have its
consumers inject the dispatcher. If it keeps logic of its own, it stays with the same public API and
injects the dispatcher. If the selection sat in a component, the component injects the dispatcher.

### Where `provideImplscan()` goes

Use the first that matches:

1. The implementations or the provider need state owned by a component: that component's `providers`,
   beside an injectable holding that state.
2. Everything using the dispatcher sits behind one lazy route: that route's `providers`.
3. Otherwise: `app.config.ts`.

### Scripts

`package.json` has a `generate` script writing to `src/app/generated/implscan-registry.ts`, and a `pre`
hook running it for each of `start`, `build`, `watch` and `test` that exists.

## Done

- `node check-layout.mjs <feature-folder>`, with the script beside this file, prints `layout ok`.
- Every section above holds, `npm run generate` prints no warnings, and tests and build pass.
