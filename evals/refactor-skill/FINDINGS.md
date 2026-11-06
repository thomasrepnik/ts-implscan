# Findings: refactoring onto ts-implscan, with and without a skill

Run on 2026-11-06 against ts-implscan 0.1.4 from `origin/master` (`b0b33cd`), Angular 22.2.

## Summary

The skill makes the architecture consistent. It doesn't make refactors more correct, because agents
were already correct without it in these scenarios.

| Measure | No skill | Skill v1 | Skill v2 |
|---|---|---|---|
| Scenarios passing hidden tests | 8/8 | 8/8 | 6/6 rerun |
| Convention checks met | 19/42 | 42/42 | 30/30 |
| New test cases kept in the repo | 18 | **7** | 25 |
| Refactors keeping no new test | 0/7 | **4/7** | 0/7 |
| Scenario 8 refused | yes | yes | yes |

- **v1's regression:** four agents wrote tests, then deleted them, one saying they weren't "part of the
  request". The hidden tests couldn't see this. v1 described the shape as the whole job, and its "Done"
  section left tests out of what counted as finished.
- **v2's fix:** specs became a required part of the shape, and the priority rule now depends on
  something checkable (one value against a closed set, or conditions that can overlap), after two v1
  agents paused over whether a ternary counted as ordered branches.
- **v2's numbers:** scenarios 3–8 were rerun. The v2 test figures include scenarios 1 and 2 from v1,
  which each already kept their tests.
- **Convention checks are partly by construction:** the exact filenames were chosen after the baseline,
  so 19/42 isn't a failure rate. The result that matters is that runs converge on one shape.
- **Triggering isn't tested:** the prompt pointed agents at the skill, so this doesn't show whether it
  loads on its own.

## Prescribed layout

The skill later took on a fixed layout from a hand-made reference project, with identical names in
every feature: `<feature>/context/{api,impl}` and `<feature>/handlers/{api,impl}`, `<Feature>Handler`,
`<Variant><Feature>Service`. Classes that would only forward are deleted. `check-layout.mjs` enforces
it and passes on the reference project unchanged. Convention checks were rewritten for this, so these
numbers don't compare with the table above.

| Measure | No skill | Layout, first rule | Layout, final rule |
|---|---|---|---|
| Convention checks met | 22/35 | 35/35 | 35/35 |
| `check-layout` passes | 0/7 | 7/7 | 7/7 |
| Scenarios passing hidden tests | 8/8 | 2/8 (see below) | 8/8 |
| New test cases kept in the repo | 18 | not compared | 52 |
| Files touched across 7 refactors | 58 | 104 | 88 |
| Scenario 8 refused | yes | yes | yes |

- **First rule:** it let other classes sit "beside" `context/` and `handlers/`, so six of seven agents
  moved or renamed whole existing folders, and the seventh bent its naming to avoid doing so. Six hidden test
  suites then couldn't find moved components, so those six runs show neither pass nor fail on behaviour.
  The rule wasn't taken from the reference project, whose feature folder holds only those two folders.
- **Final rule:** a new folder directly under `src/app`, holding only those two folders, with every other
  class left in place.
- **The cost:** 88 files against 58 without a skill, about 50% more, partly because agents added a spec
  beside each service.
- **What still varies:** agents pick the feature name, giving `payment` and `payment-format` for similar
  cases, and `fee` beside an existing `fees`. The check can't judge names.
- **Added after these runs:** several agents pointed out that shared code had no place in the layout, so
  an optional `shared/` folder now sits beside `context/` and `handlers/`. It's covered by the tests of
  `check-layout.mjs`, but no blind run has used it yet.

## Result without a skill

**All 8 blind runs passed every hidden test and structural check, with no skill.** No hazard caught
any agent. What differed between runs was the architecture, which is what a skill was meant to keep
the same.

| # | Scenario | Score | What the agent did about the hazard |
|---|---|---|---|
| 1 | Simple | pass | No hazard (control) |
| 2 | Stateful | pass | Pinned the method at `begin()`, kept `none` before it |
| 3 | Lazy | pass | Put `provideImplscan()` on the lazy route |
| 4 | Eager | pass | Removed the constructor subscription; its own test exposed the request |
| 5 | Async fallback | pass | Standard always applies, priorities 30/20/10 match the old order |
| 6 | Scoped | pass | Tried root, hit `NG0201`, moved `provideImplscan()` to the component |
| 7 | Generator limits | pass | Dropped `Exporter<T>` after a dry run; found and reported the import cycle |
| 8 | Should refuse | pass | Changed nothing, explained why, recommended a shared helper |

Every agent that refactored also added tests of the affected behaviour. Six of the seven passing
refactors raised the README's "probably overkill for two implementations" caveat unprompted, or said
the gain depends on more implementations coming.

## Can these results be trusted?

- **The checks can fail.** Breaking each reference the naive way was caught:

  | Naive change | Scorer result |
  |---|---|
  | 2: context reads the live selection | `paypal:5` instead of `card:110` |
  | 3: root `provideImplscan()` | Both markers in the initial bundle |
  | 4: keep the constructor subscribe | Session request during a card payment |
  | 5: flat priorities, no fallback | `No applicable implementation` while loading |
  | 6: root `provideImplscan()` | `NG0201: No provider found` |
  | 7: originals | The dispatcher and collection checks fail |

- **No leaks.** Across all 22 agent runs, one tool call mentioned the lab folder: an agent looking for
  its own `.playwright-mcp` output. No agent read a scenario, hidden test or `expect.json`. Two agents
  briefly wrote scratch files outside their run folder and one left a folder in the repo root, since
  removed; none of these touched hidden files.
- **Limits of this evidence:**
  - One run per scenario, on the same capable model, so a failure rate can't be read from this.
  - The fixtures are about 5–10 files, so every hazard was within reach of reading the code. In a
    large app, the code that breaks may be far from the classes named in the prompt.
  - Scenario 8 was refused when nothing pushed back. A developer who insists wasn't tested.

## What actually varied: the architecture

| Decision | Variants seen | Runs |
|---|---|---|
| Where the context type lives | Own file / interface's file / none | 1, 2, 4, 5 / 3, 7 / 6 |
| Where the provider lives | `*.provider.ts` / context file / none | 1, 2, 5, 7 / 4 / 3, 6 |
| How context is supplied | Provider class / token on the component / no context | 1, 2, 4, 5, 7 / 3 / 6 |
| Priority for exclusive implementations | `0` / `10` | 2, 4, 7 / 1, 3, 6 |
| The old caller or facade | Kept / deleted | 1, 2, 3, 6, 7 / 4, 5 |
| Generator hooks in `package.json` | 4 hooks / 3 hooks / none | 1–5 / 6 / 7 (7's script already existed) |

Some differences follow from the scenario, such as 3 and 6 scoping their providers. Most don't. These
are the choices that would make a codebase look inconsistent after dozens of refactors.

## Earlier claims, checked

| Claim | Status |
|---|---|
| All implementations are created on first inject | **Confirmed** (scenario 4) |
| Root registration pulls lazy strategies into the initial bundle | **Confirmed** (scenario 3 control) |
| Per-call choice can split state | **Confirmed** (scenario 2 control) |
| New runtime throws where an `else` used to catch everything | **Confirmed** (scenario 5 control) |
| Scoped dependencies fail at runtime with root registration | **Confirmed** (scenario 6) |
| Generator warnings exit 0 and are easy to miss | **Half confirmed**: exit 0 is real, but no agent missed one |
| Import cycles crash | **Corrected**: see below |
| "Having things in common" leads agents to the wrong refactor | **Not reproduced** (scenario 8) |

So the hazards are real, but capable agents handled them here, so hazard rules aren't backed by these
runs.

## Generator and library issues

1. **Import cycle (confirmed).** If an implementation uses another dispatcher, it imports the registry
   and the registry imports it. Loaded first, this gives:
   - plain target under native ESM: `ReferenceError: Cannot access 'A' before initialization`
   - Angular's bundler: `undefined` in `XImplementations`, with no error. DI still works, because
     `provideImplscan()` reads the classes when called.
2. **One registry, all or nothing (raised independently by several agents, not separately tested).**
   `provideImplscan()` registers every interface, and the file statically imports every implementation.
   Scoping one interface to a route or component therefore scopes all of them, and an eager import of
   the registry pulls in every lazy implementation. Separate `--src`/`--out` runs per feature are the
   way around it today. For heavy use across an app, this looks like the main scaling limit.
3. **`--strict` has no evidence behind it yet.** The behaviour is real, but no agent was caught by it.

## Reproduce

See [README.md](README.md).
