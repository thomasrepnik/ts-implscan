#!/usr/bin/env node
// Creates a blind run: template + scenario app, with its own git baseline. Nothing from the
// scenario's acceptance/, reference/ or expect.json is copied.
// usage: prepare.mjs <scenario> <run-dir> [--cache <dir>] [--skill]
import { cpSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { clone, ensureBase, LAB, REPO, scenarioDir, sh } from './lib.mjs';

const { values, positionals } = parseArgs({ allowPositionals: true, options: { cache: { type: 'string' }, skill: { type: 'boolean' } } });
const [scenario, runDir] = positionals;
const run = resolve(runDir);
const cache = resolve(values.cache ?? join(run, '..', '.cache'));
const dir = scenarioDir(scenario);

clone(ensureBase(cache), run);
cpSync(join(dir, 'app'), run, { recursive: true });
if (existsSync(join(dir, 'setup.sh'))) {
  const setup = sh(`bash "${join(dir, 'setup.sh')}"`, run);
  if (!setup.ok) throw new Error(setup.out);
}
if (values.skill) {
  mkdirSync(join(run, '.claude/skills'), { recursive: true });
  cpSync(join(REPO, 'skills/ts-implscan-refactor'), join(run, '.claude/skills/ts-implscan-refactor'), { recursive: true });
}
sh('git init -q && git add -A && git -c user.name=lab -c user.email=lab@example.invalid commit -qm baseline', run);
console.log(`${run}\nprompt: ${readFileSync(join(dir, 'prompt.txt'), 'utf8').trim()}`);
