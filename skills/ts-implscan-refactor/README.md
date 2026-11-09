# ts-implscan-refactor

An agent skill for refactoring existing Angular code onto ts-implscan. The agent reads
[SKILL.md](SKILL.md). This file is for people.

## An opinionated skill

ts-implscan itself doesn't care where your files live or what your classes are called. This skill
does: it settles on one shape and makes every refactor follow it.

- **Layout:** each `Dispatchable` gets its own feature folder, with `context/` and `handlers/`, each
  split into `api/` and `impl/`.
- **Naming:** `<Feature>Handler`, `<Feature>Context`, `<Feature>ContextProvider` and
  `<Variant><Feature>Service`.
- **Context provider:** the context always comes from a `DispatchContextProvider` class.
- **Priorities:** priorities follow fixed rules.
- **Specs first:** the old selection is covered by specs before it changes.

These choices are there so that a codebase with many dispatchers reads as one, not because other
layouts are wrong. [check-layout.mjs](check-layout.mjs) enforces the layout:

```sh
node check-layout.mjs src/app/payment
```

## A blueprint

Even if you don't use an AI agent, or you prefer a different layout, the skill shows how to refactor
existing code onto ts-implscan step by step:

1. Pin the current behaviour with specs.
2. Move the strategy classes into one place behind a `Dispatchable` interface.
3. Supply the context.
4. Replace the hand-written selection with the generated dispatcher.

Use it as it is, or copy it and adjust the conventions to match your codebase. If you change the
layout, change `check-layout.mjs` to match.

## Installing it

See [Refactoring with an AI agent](../../README.md#refactoring-with-an-ai-agent) in the main
README.
