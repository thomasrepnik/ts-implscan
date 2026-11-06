#!/usr/bin/env node
// Proves the lab itself: visible tests pass on each original, and the full score passes on the
// reference solution. Also shows what the original scores, so a check that can never fail stands out.
// usage: validate.mjs <cache-dir> [scenario...]
import { cpSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { LAB, scenarioDir, scenarioNames, sh } from './lib.mjs';

const [cacheDir, ...names] = process.argv.slice(2);
const cache = resolve(cacheDir);
const score = (name, run) => JSON.parse(sh(`node "${join(LAB, 'scripts/score.mjs')}" ${name} "${run}"`, run).out);
let bad = 0;
for (const name of names.length ? names : scenarioNames()) {
  const dir = scenarioDir(name);
  const run = join(cache, 'validate', name);
  const prepared = sh(`node "${join(LAB, 'scripts/prepare.mjs')}" ${name} "${run}" --cache "${cache}"`, LAB);
  if (!prepared.ok) throw new Error(prepared.out);
  const visible = sh('npx ng test --no-watch', run);
  const original = score(name, run);
  if (existsSync(join(dir, 'reference'))) cpSync(join(dir, 'reference'), run, { recursive: true });
  if (existsSync(join(dir, 'reference.sh'))) {
    const applied = sh(`bash "${join(dir, 'reference.sh')}"`, run);
    if (!applied.ok) throw new Error(applied.out);
  }
  const reference = score(name, run);
  const ok = visible.ok && reference.pass;
  if (!ok) bad++;
  console.log(`\n=== ${name}: ${ok ? 'OK' : 'BROKEN'}`);
  console.log(`visible on original: ${visible.ok ? 'pass' : `FAIL\n${visible.out.slice(-1200)}`}`);
  console.log(`original fails: ${original.failed.map((c) => c.name).join(' | ') || '(nothing)'}`);
  console.log(`reference: ${reference.pass ? 'pass' : `FAIL ${JSON.stringify(reference.failed, null, 1)}`}`);
}
process.exit(bad ? 1 : 0);
