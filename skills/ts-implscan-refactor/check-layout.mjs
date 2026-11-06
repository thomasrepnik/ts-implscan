#!/usr/bin/env node
// Checks that every Dispatchable under the given folders follows the skill's layout.
// usage: node check-layout.mjs <folder>...   exits 1 and lists each problem if one is found
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';

const kebab = (name) => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

function tsFiles(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return entry === 'node_modules' || entry === 'generated' ? [] : tsFiles(path);
    return path.endsWith('.ts') && !path.endsWith('.spec.ts') && !path.endsWith('.d.ts') ? [path] : [];
  });
}

export function checkLayout(folders) {
  const problems = [];
  const files = folders.map((folder) => resolve(folder)).flatMap(tsFiles).map((path) => ({ path, text: readFileSync(path, 'utf8') }));
  const interfaces = files.flatMap((file) => [...file.text.matchAll(/interface\s+(\w+)\s+extends\s+Dispatchable\b(?:<(\w+)>)?/g)].map((m) => ({ file, name: m[1], context: m[2] })));

  for (const { file, name, context } of interfaces) {
    const fail = (message) => problems.push(`${name}: ${message}`);
    if (!name.endsWith('Handler')) {
      fail(`name it <Feature>Handler (in ${relative('.', file.path)})`);
      continue;
    }
    const Feature = name.slice(0, -'Handler'.length);
    const stem = kebab(Feature);
    const apiDir = dirname(file.path);
    const root = dirname(dirname(apiDir));

    const expectFile = (path, what) => {
      if (!existsSync(path)) fail(`missing ${relative('.', path)} (${what})`);
      return existsSync(path);
    };
    const onlyExport = (path, what) => {
      const exported = [...readFileSync(path, 'utf8').matchAll(/export\s+(?:abstract\s+)?(?:interface|type|class|const|function|enum)\s+(\w+)/g)].map((m) => m[1]);
      const extra = exported.filter((e) => e !== what);
      if (extra.length) fail(`${relative('.', path)} holds only ${what}, found also ${extra.join(', ')}`);
    };

    if (basename(root) !== stem) fail(`feature folder must be named ${stem}, found ${basename(root)}`);
    if (!dirname(root).endsWith(join('src', 'app'))) fail(`feature folder must be directly under src/app, found ${relative('.', root)}`);
    const extras = readdirSync(root).filter((entry) => !['context', 'handlers', 'shared'].includes(entry));
    if (extras.length) fail(`${relative('.', root)} holds only context/, handlers/ and shared/, found also ${extras.join(', ')}`);
    if (file.path !== join(root, 'handlers/api', `${stem}-handler.ts`)) fail(`interface must be in <feature>/handlers/api/${stem}-handler.ts, found ${relative('.', file.path)}`);
    onlyExport(file.path, name);

    const contextName = `${Feature}Context`;
    if (context !== contextName) fail(`must extend Dispatchable<${contextName}>`);
    const contextFile = join(root, 'context/api', `${stem}-context.ts`);
    if (expectFile(contextFile, contextName)) onlyExport(contextFile, contextName);

    const providerName = `${Feature}ContextProvider`;
    const providerFile = join(root, 'context/impl', `${stem}-context.provider.ts`);
    if (expectFile(providerFile, providerName)) {
      onlyExport(providerFile, providerName);
      if (!new RegExp(`class\\s+${providerName}\\s+implements\\s+DispatchContextProvider<${contextName}>`).test(readFileSync(providerFile, 'utf8'))) {
        fail(`${relative('.', providerFile)} must declare ${providerName} implements DispatchContextProvider<${contextName}>`);
      }
    }

    const implementations = files.flatMap((f) => [...f.text.matchAll(new RegExp(`(?<!abstract\\s+)class\\s+(\\w+)[^{]*\\bimplements\\b[^{]*\\b${name}\\b`, 'g'))].map((m) => ({ path: f.path, name: m[1] })));
    if (implementations.length === 0) fail('no implementations found');
    for (const impl of implementations) {
      const match = impl.name.match(new RegExp(`^(\\w+)${Feature}Service$`));
      if (!match) {
        fail(`implementation ${impl.name} must be named <Variant>${Feature}Service`);
        continue;
      }
      const expected = join(root, 'handlers/impl', `${kebab(match[1])}-${stem}.service.ts`);
      if (impl.path !== expected) fail(`${impl.name} must be in ${relative('.', expected)}, found ${relative('.', impl.path)}`);
    }

    const allowed = new Map([
      ['handlers/api', [file.path]],
      ['handlers/impl', implementations.map((impl) => impl.path)],
      ['context/api', [contextFile]],
      ['context/impl', [providerFile]],
    ]);
    for (const [dir, paths] of allowed) {
      const full = join(root, dir);
      if (!existsSync(full)) continue;
      for (const path of tsFiles(full)) if (!paths.includes(path)) fail(`unexpected file ${relative('.', path)}`);
    }
  }
  return { interfaces: interfaces.map((i) => i.name), problems };
}

if (process.argv[1] && import.meta.url.endsWith(basename(process.argv[1]))) {
  const folders = process.argv.slice(2);
  if (folders.length === 0) {
    console.error('usage: node check-layout.mjs <folder>...');
    process.exit(2);
  }
  const { interfaces, problems } = checkLayout(folders);
  if (interfaces.length === 0) {
    console.error('no interface extending Dispatchable found');
    process.exit(1);
  }
  for (const problem of problems) console.error(problem);
  if (problems.length) process.exit(1);
  console.log(`layout ok: ${interfaces.join(', ')}`);
}
