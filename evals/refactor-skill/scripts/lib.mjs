import { execSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const LAB = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const REPO = resolve(LAB, '../..');
export const SCENARIOS = join(LAB, 'scenarios');

export const scenarioNames = () => readdirSync(SCENARIOS).filter((n) => statSync(join(SCENARIOS, n)).isDirectory()).sort();
export const scenarioDir = (name) => {
  const match = scenarioNames().find((n) => n === name || n.startsWith(`${name}-`));
  if (!match) throw new Error(`unknown scenario ${name}`);
  return join(SCENARIOS, match);
};

export function sh(command, cwd) {
  const r = spawnSync(command, { cwd, shell: true, encoding: 'utf8', env: { ...process.env, CI: '1', NG_CLI_ANALYTICS: 'false' } });
  return { ok: r.status === 0, status: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

export function listFiles(dir, skip = new Set(['node_modules', '.angular', 'dist', '.git'])) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    if (skip.has(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...listFiles(p, skip));
    else out.push(p);
  }
  return out;
}

/**
 * Builds <cacheDir>/base once: the template plus ts-implscan installed from a tarball of this
 * checkout, so node_modules holds the real package and README. Runs are clones of it.
 */
export function ensureBase(cacheDir) {
  const base = join(cacheDir, 'base');
  if (existsSync(join(base, 'node_modules/@thomasrepnik/ts-implscan/README.md'))) return base;
  rmSync(base, { recursive: true, force: true });
  mkdirSync(cacheDir, { recursive: true });
  cpSync(join(LAB, 'template'), base, { recursive: true, filter: (s) => !/\/(node_modules|dist|\.angular)(\/|$)/.test(s) });
  mkdirSync(join(base, 'vendor'), { recursive: true });
  const tarball = execSync(`npm pack --silent --pack-destination "${join(base, 'vendor')}"`, { cwd: REPO, encoding: 'utf8' }).trim().split('\n').pop();
  const install = sh(`npm install --no-audit --no-fund --save-dev "./vendor/${tarball}"`, base);
  if (!install.ok) throw new Error(install.out);
  return base;
}

export const clone = (from, to) => {
  rmSync(to, { recursive: true, force: true });
  mkdirSync(dirname(to), { recursive: true });
  execSync(`cp -cR "${from}" "${to}" 2>/dev/null || cp -R "${from}" "${to}"`, { shell: '/bin/bash' });
};

export const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
