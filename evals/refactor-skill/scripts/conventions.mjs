#!/usr/bin/env node
// Measures how closely finished runs follow the architecture conventions of the skill.
// usage: conventions.mjs <runs-dir>   (expects one folder per scenario, named by number)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { checkLayout } from '../../../skills/ts-implscan-refactor/check-layout.mjs';
import { listFiles, readJson, sh } from './lib.mjs';

const runs = process.argv[2];
const HOOKS = ['prestart', 'prebuild', 'prewatch', 'pretest'];
// selecting classes that end up only forwarding, so the skill removes them
const FORWARDERS = { '04': 'payment-router.ts', '05': 'fee.service.ts' };
// a selecting class with logic of its own, which has to stay
const KEPT = { '02': 'payment-session.ts' };
// the priorities that reproduce the old if/else order; every other scenario is exclusive
const PRIORITIES = { '05': '0,10,20' };

function evaluate(name, run) {
  const changed = sh('git status --short --untracked-files=all -- src', run).out.split('\n').filter(Boolean).map((l) => l.slice(3).trim());
  const sources = changed.map((f) => join(run, f.split(' -> ').pop())).filter((f) => f.endsWith('.ts') && existsSync(f) && !f.includes('/generated/') && !f.endsWith('.spec.ts'));
  const iface = sources.find((f) => /interface\s+\w+\s+extends\s+Dispatchable\b/.test(readFileSync(f, 'utf8')));
  if (!iface) return undefined;
  // the feature folder sits two levels above handlers/api; off-layout runs check the interface's folder
  const inLayout = dirname(iface).endsWith('handlers/api');
  const feature = inLayout ? dirname(dirname(dirname(iface))) : dirname(iface);
  const cwd = process.cwd();
  process.chdir(run);
  const { problems } = checkLayout([feature]);
  process.chdir(cwd);
  const impl = sources.filter((f) => /isApplicableTo\s*\(/.test(readFileSync(f, 'utf8')));
  const priorities = [...new Set(impl.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/getPriority\(\)[^{]*\{\s*return\s+(-?\d+)/g)].map((m) => Number(m[1]))))].sort((a, b) => a - b).join(',');
  const pkg = readJson(join(run, 'package.json'));
  const scripts = pkg.scripts ?? {};
  const present = (file) => listFiles(join(run, 'src')).some((f) => basename(f) === file);
  return {
    'check-layout passes': problems.length === 0,
    'priorities match': priorities === (PRIORITIES[name] ?? '0'),
    'forwarder deleted, logic kept': (!FORWARDERS[name] || !present(FORWARDERS[name])) && (!KEPT[name] || present(KEPT[name])),
    'registry at src/app/generated': scripts.generate?.includes('src/app/generated/implscan-registry.ts') && existsSync(join(run, 'src/app/generated/implscan-registry.ts')),
    'all generator hooks': HOOKS.every((h) => scripts[h]?.includes('generate')),
  };
}

const rows = readdirSync(runs).filter((n) => /^\d\d$/.test(n)).sort().map((n) => [n, evaluate(n, join(runs, n))]).filter(([, r]) => r);
const names = Object.keys(rows[0]?.[1] ?? {});
let met = 0;
for (const check of names) {
  const passing = rows.filter(([, r]) => r[check]).map(([n]) => n);
  met += passing.length;
  console.log(`${String(passing.length).padStart(2)}/${rows.length}  ${check.padEnd(34)} ${rows.filter(([, r]) => !r[check]).map(([n]) => n).join(' ') || '-'}`);
}
console.log(`\ntotal ${met}/${names.length * rows.length} (the last column lists the runs that differ)`);
