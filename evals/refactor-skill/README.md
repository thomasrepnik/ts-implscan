# Refactoring lab

Blind Angular scenarios for testing how an agent refactors onto ts-implscan. Results are in
[FINDINGS.md](FINDINGS.md). This folder isn't part of the npm package or the root tsconfig.

Each folder in `scenarios/` holds:

| Path | Purpose |
|---|---|
| `app/` | The code to refactor, with visible tests |
| `prompt.txt` | The only instruction the agent gets |
| `acceptance/`, `expect.json` | Hidden tests and structural checks, added only when scoring |
| `reference/`, `reference.sh` | A working solution, proving the checks can pass |
| `setup.sh` | Optional setup for the starting state |

## Usage

Use a directory outside this repository for `<lab>`, so that agents can't see the hidden files.

```sh
# check the lab itself: visible tests pass on originals, full score passes on references
node scripts/validate.mjs <lab>

# create a blind run; add --skill to include skills/ts-implscan-refactor
node scripts/prepare.mjs 02 <lab>/runs/02 --cache <lab>

# after an agent has worked in that folder, score it
cd <lab>/runs/02 && node <repo>/evals/refactor-skill/scripts/score.mjs 02 .

# compare a folder of finished runs against the skill's conventions
node scripts/conventions.mjs <lab>/runs
```

Give the agent the contents of `prompt.txt` and tell it to stay inside the run folder. The score is
printed as JSON. Scoring writes generated output into the run folder, so score a run only once it's
finished.
