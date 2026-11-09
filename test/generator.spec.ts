import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Project, ScriptTarget } from 'ts-morph';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  analyzeDispatcher,
  type DispatcherAnalysis,
  type DispatcherModel,
  DISPATCH_MARKER,
  RESOLVE_DELEGATE_SOURCE,
  renderDispatcher,
  TypeImports,
} from '../src/dispatcher.ts';

const MARKER_FILE = `export interface ImplScan {}
export interface Dispatchable<T> extends ImplScan { isApplicableTo(context: T): boolean; getPriority?(): number; }`;

function project(files: Record<string, string>): Project {
  const p = new Project({ useInMemoryFileSystem: true, compilerOptions: { strict: true, target: ScriptTarget.ES2022 } });
  p.createSourceFile('/src/marker.ts', MARKER_FILE);
  for (const [path, text] of Object.entries(files)) p.createSourceFile(path, text);
  return p;
}

function analyze(p: Project, file: string, name: string, reserved: string[] = []): DispatcherAnalysis {
  const iface = p.getSourceFileOrThrow(file).getInterfaceOrThrow(name);
  const marker = iface.getExtends().find((c) => c.getExpression().getText() === DISPATCH_MARKER)!;
  return analyzeDispatcher(iface, marker, (f) => f.replace(/^\/src\//, './').replace(/\.ts$/, ''), reserved);
}

test('copies method and property signatures', () => {
  const p = project({
    '/src/ctx.ts': `export interface Ctx { method: string }`,
    '/src/h.ts': `import type { Dispatchable } from './marker';
import type { Ctx } from './ctx';
export interface H extends Dispatchable<Ctx> {
  name: string;
  readonly id: number;
  pay(amount: number): string;
  reset(): void;
  log(level?: string, ...parts: string[]): void;
  first<T extends object>(items: T[]): T | undefined;
}`,
  });
  const r = analyze(p, '/src/h.ts', 'H');
  assert.equal(r.ok, true, JSON.stringify(r));
  if (!r.ok) return;
  assert.equal(r.model.className, 'HDispatcher');
  assert.equal(r.model.contextType, 'Ctx');
  assert.deepEqual(
    r.model.members.map((m) => [m.kind, m.signature, m.args, m.returnsVoid, m.readonly]),
    [
      ['property', 'string', '', false, false],
      ['property', 'number', '', false, true],
      ['method', 'pay(amount: number): string', 'amount', false, false],
      ['method', 'reset(): void', '', true, false],
      ['method', 'log(level?: string, ...parts: string[]): void', 'level, ...parts', true, false],
      ['method', 'first<T extends object>(items: T[]): T | undefined', 'items', false, false],
    ],
  );
  assert.deepEqual(
    r.model.members.map((m) => m.name),
    ['name', 'id', 'pay', 'reset', 'log', 'first'],
  );
});

test('collects imports: relative recomputed, bare kept, aliases kept, same-file types imported, globals and type params skipped', () => {
  const p = project({
    '/src/ctx.ts': `export interface Ctx { method: string }`,
    '/src/dto.ts': `export interface Dto { id: string }`,
    '/src/h.ts': `import type { Dispatchable } from './marker';
import type { Ctx } from './ctx';
import type { Dto as Row } from './dto';
import type { Observable } from 'rxjs';
import type * as api from 'generated/api';
export type Mode = 'a' | 'b';
export interface H extends Dispatchable<Ctx> {
  rows(): Row[];
  stream(): Observable<Blob>;
  mode(m: Mode): Promise<api.Answer>;
  pick<T>(x: T): T;
}`,
  });
  const r = analyze(p, '/src/h.ts', 'H');
  assert.equal(r.ok, true, JSON.stringify(r));
  if (!r.ok) return;
  assert.deepEqual(r.model.imports.render(), [
    `import type { Ctx } from './ctx';`,
    `import type { Dto as Row } from './dto';`,
    `import type { H, Mode } from './h';`,
    `import type * as api from 'generated/api';`,
    `import type { Observable } from 'rxjs';`,
  ]);
});

test('members inherited from a non-generic base in another file resolve imports from that file', () => {
  const p = project({
    '/src/ctx.ts': `export interface Ctx {}`,
    '/src/dto.ts': `export interface Dto {}`,
    '/src/base.ts': `import type { Dto } from './dto';
export interface Base { load(): Dto }`,
    '/src/h.ts': `import type { Dispatchable } from './marker';
import type { Ctx } from './ctx';
import type { Base } from './base';
export interface H extends Base, Dispatchable<Ctx> { run(): void }`,
  });
  const r = analyze(p, '/src/h.ts', 'H');
  assert.equal(r.ok, true, JSON.stringify(r));
  if (!r.ok) return;
  assert.deepEqual(
    r.model.members.map((m) => m.name),
    ['run', 'load'],
  );
  assert.ok(r.model.imports.render().includes(`import type { Dto } from './dto';`), r.model.imports.render().join('\n'));
});

test('TypeImports merges and detects collisions', () => {
  const a = new TypeImports(['CardHandler']);
  assert.equal(a.add('./x', 'Foo'), undefined);
  assert.equal(a.add('./x', 'Foo'), undefined);
  assert.match(a.add('./y', 'Foo')!, /Foo/);
  assert.match(a.add('./z', 'CardHandler')!, /CardHandler/);
  const b = new TypeImports();
  b.add('./x', 'Bar');
  b.add('./y', 'Foo');
  assert.match(a.merge(b)!, /Foo/);
  assert.deepEqual(a.render(), [`import type { Foo } from './x';`]);
});

const unsupported: Array<[string, string, RegExp]> = [
  ['overload', `export interface H extends Dispatchable<Ctx> { pay(a: number): string; pay(a: string): string }`, /overloaded.*pay/],
  ['optional method', `export interface H extends Dispatchable<Ctx> { pay?(): string }`, /optional.*pay/],
  ['optional property', `export interface H extends Dispatchable<Ctx> { name?: string }`, /optional.*name/],
  ['destructured parameter', `export interface H extends Dispatchable<Ctx> { pay({ a }: { a: number }): void }`, /destructured.*pay/],
  ['accessor', `export interface H extends Dispatchable<Ctx> { get name(): string }`, /accessor.*name/],
  ['this return type', `export interface H extends Dispatchable<Ctx> { self(): this }`, /this.*self/],
  ['call signature', `export interface H extends Dispatchable<Ctx> { (x: number): void }`, /call signature/],
  ['index signature', `export interface H extends Dispatchable<Ctx> { [key: string]: unknown }`, /index signature/],
  ['generic interface', `export interface H<T> extends Dispatchable<Ctx> { get(): T }`, /generic/],
  ['generic base', `export interface Base<T> { get(): T }\nexport interface H extends Base<string>, Dispatchable<Ctx> {}`, /generic base.*Base/],
  ['non-exported type', `interface Hidden {}\nexport interface H extends Dispatchable<Ctx> { get(): Hidden }`, /Hidden.*not exported/],
  ['reserved member name', `export interface H extends Dispatchable<Ctx> { delegate: string }`, /reserved.*delegate/],
  ['non-identifier member name', `export interface H extends Dispatchable<Ctx> { 'pay-now'(): void }`, /name.*pay-now/],
  ['import() type', `export interface H extends Dispatchable<Ctx> { load(): import('./ctx').Ctx }`, /import\(\).*load/],
];
for (const [title, body, reason] of unsupported) {
  test(`rejects ${title}`, () => {
    const p = project({ '/src/h.ts': `import type { Dispatchable } from './marker';\nexport interface Ctx {}\n${body}` });
    const r = analyze(p, '/src/h.ts', 'H');
    assert.equal(r.ok, false, JSON.stringify(r));
    if (r.ok) return;
    assert.match(r.reason, reason);
  });
}

test('rejects an import that collides with a reserved local name', () => {
  const p = project({
    '/src/h.ts': `import type { Dispatchable } from './marker';\nimport type { Card } from './card';\nexport interface Ctx {}\nexport interface H extends Dispatchable<Ctx> { card(): Card }`,
    '/src/card.ts': `export interface Card {}`,
  });
  const r = analyze(p, '/src/h.ts', 'H', ['Card']);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.match(r.reason, /Card/);
});

function renderModel(): DispatcherModel {
  const p = project({
    '/src/h.ts': `import type { Dispatchable } from './marker';
export interface Ctx { m: string }
export interface H extends Dispatchable<Ctx> {
  name: string;
  readonly id: number;
  pay(amount: number): string;
  log(...parts: string[]): void;
}`,
  });
  const r = analyze(p, '/src/h.ts', 'H');
  assert.equal(r.ok, true, JSON.stringify(r));
  if (!r.ok) throw new Error('unreachable');
  return r.model;
}

test('renders the angular dispatcher', () => {
  assert.equal(
    renderDispatcher(renderModel(), 'angular', { list: 'H_LIST', context: 'H_CONTEXT' }).join('\n'),
    `export class HDispatcher implements H {
  private readonly implementations = inject(H_LIST);
  private readonly context = inject(H_CONTEXT);

  private get delegate(): H {
    return resolveDelegate('HDispatcher', this.implementations, this.context());
  }

  isApplicableTo(context: Ctx): boolean {
    return this.delegate.isApplicableTo(context);
  }

  getPriority(): number {
    return this.delegate.getPriority?.() ?? 0;
  }

  get name(): string {
    return this.delegate.name;
  }

  set name(value: string) {
    this.delegate.name = value;
  }

  get id(): number {
    return this.delegate.id;
  }

  pay(amount: number): string {
    return this.delegate.pay(amount);
  }

  log(...parts: string[]): void {
    this.delegate.log(...parts);
  }
}`,
  );
});

test('renders the plain dispatcher with an explicit constructor', () => {
  const lines = renderDispatcher(renderModel(), 'plain');
  assert.deepEqual(lines.slice(0, 9), [
    'export class HDispatcher implements H {',
    '  private readonly implementations: H[];',
    '  private readonly context: () => Ctx;',
    '',
    '  constructor(implementations: H[], context: () => Ctx) {',
    '    this.implementations = implementations;',
    '    this.context = context;',
    '  }',
    '',
  ]);
  assert.ok(!lines.join('\n').includes('inject('));
});

const redeclared: Array<[string, string, string]> = [
  ['the same isApplicableTo', 'isApplicableTo', `export interface H extends Dispatchable<Ctx> { isApplicableTo(context: Ctx): boolean }`],
  ['the same getPriority', 'getPriority', `export interface H extends Dispatchable<Ctx> { getPriority(): number }`],
  ['a context-free isApplicableTo', 'isApplicableTo', `export interface H extends Dispatchable<void> { isApplicableTo(): boolean }`],
  ['a narrowed return type', 'getPriority', `export interface H extends Dispatchable<Ctx> { getPriority(): 1 | 2 }`],
  ['an extra optional parameter', 'isApplicableTo', `export interface H extends Dispatchable<Ctx> { isApplicableTo(c: Ctx, strict?: boolean): boolean }`],
  ['an overload', 'isApplicableTo', `export interface H extends Dispatchable<Ctx> { isApplicableTo(c: Ctx): boolean; isApplicableTo(c: string): boolean }`],
  ['a property', 'getPriority', `export interface H extends Dispatchable<Ctx> { getPriority: () => number }`],
  ['a base listed first', 'getPriority', `export interface Base { getPriority(): number }\nexport interface H extends Base, Dispatchable<Ctx> {}`],
  ['a base listed after the marker', 'getPriority', `export interface Base { getPriority(): number }\nexport interface H extends Dispatchable<Ctx>, Base {}`],
  ['a generic base', 'isApplicableTo', `export interface Base<T> { isApplicableTo(c: T): boolean }\nexport interface H extends Base<Ctx>, Dispatchable<Ctx> {}`],
  ['a type alias base', 'getPriority', `export type Base = { getPriority(): number };\nexport interface H extends Base, Dispatchable<Ctx> {}`],
  ['a generic interface', 'getPriority', `export interface H<T> extends Dispatchable<Ctx> { getPriority(): number; run(): T }`],
];
for (const [title, member, body] of redeclared) {
  test(`stops the generation for ${title}`, () => {
    const p = project({ '/src/h.ts': `import type { Dispatchable } from './marker';\nexport interface Ctx {}\n${body}` });
    const r = analyze(p, '/src/h.ts', 'H');
    assert.equal(r.ok, false, JSON.stringify(r));
    if (r.ok) return;
    assert.equal(r.fatal, true);
    assert.match(r.reason, new RegExp(`\\bH\\b.*\\b${member}\\b.*automatically.*must not`));
  });
}

test('resolveDelegate source applies the selection rules', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'implscan-'));
  const file = path.join(dir, 'resolve.ts');
  writeFileSync(file, `${RESOLVE_DELEGATE_SOURCE.join('\n')}\nexport { resolveDelegate };\n`);
  const { resolveDelegate } = (await import(pathToFileURL(file).href)) as {
    resolveDelegate: <I>(owner: string, implementations: I[], context: unknown) => I;
  };
  const impl = (name: string, applicable: boolean, priority: number) => {
    const cls = { [name]: class { isApplicableTo() { return applicable; } getPriority() { return priority; } } }[name]!;
    return new cls();
  };

  assert.throws(() => resolveDelegate('X', [], { m: 1 }), /\[X\] No applicable implementation for context=\{"m":1\}\. Available=$/);
  const only = impl('Only', true, 0);
  assert.equal(resolveDelegate('X', [only, impl('Other', false, 9)], {}), only);
  const high = impl('High', true, 2);
  assert.equal(resolveDelegate('X', [impl('Low', true, 1), high], {}), high);
  assert.throws(() => resolveDelegate('X', [impl('A', true, 1), impl('B', true, 1)], {}), /Ambiguous implementations.*HighestPriority=1.*HighestCandidates=A\(priority=1\), B\(priority=1\)/);
  const unranked = (name: string) => new ({ [name]: class { isApplicableTo() { return true; } } }[name]!)();
  const plain = unranked('Plain');
  assert.equal(resolveDelegate('X', [plain, impl('Other', false, 9)], {}), plain);
  const ranked = impl('Ranked', true, 1);
  assert.equal(resolveDelegate('X', [unranked('Plain'), ranked], {}), ranked);
  assert.throws(() => resolveDelegate('X', [unranked('A'), unranked('B')], {}), /Ambiguous implementations.*HighestPriority=0.*HighestCandidates=A\(priority=0\), B\(priority=0\)/);
  const circular: { self?: unknown } = {};
  circular.self = circular;
  assert.throws(() => resolveDelegate('X', [], circular), /context=\[object Object\]/);
});

function contextFreeModel(extendsClause = 'Dispatchable'): DispatcherModel {
  const p = project({
    '/src/h.ts': `import type { Dispatchable } from './marker';
export interface H extends ${extendsClause} {
  format(lines: string[]): string;
}`,
  });
  const r = analyze(p, '/src/h.ts', 'H');
  assert.equal(r.ok, true, JSON.stringify(r));
  if (!r.ok) throw new Error('unreachable');
  return r.model;
}

test('no type argument (or void) means a context-free dispatcher', () => {
  assert.equal(contextFreeModel().contextType, undefined);
  assert.equal(contextFreeModel('Dispatchable<void>').contextType, undefined);
  assert.deepEqual(
    contextFreeModel().members.map((m) => m.name),
    ['format'],
  );
});

test('renders the context-free angular dispatcher without context field or argument', () => {
  assert.equal(
    renderDispatcher(contextFreeModel(), 'angular', { list: 'H_LIST' }).join('\n'),
    `export class HDispatcher implements H {
  private readonly implementations = inject(H_LIST);

  private get delegate(): H {
    return resolveDelegate('HDispatcher', this.implementations);
  }

  isApplicableTo(): boolean {
    return this.delegate.isApplicableTo();
  }

  getPriority(): number {
    return this.delegate.getPriority?.() ?? 0;
  }

  format(lines: string[]): string {
    return this.delegate.format(lines);
  }
}`,
  );
});

test('renders the context-free plain dispatcher with a one-argument constructor', () => {
  assert.deepEqual(renderDispatcher(contextFreeModel(), 'plain').slice(0, 6), [
    'export class HDispatcher implements H {',
    '  private readonly implementations: H[];',
    '',
    '  constructor(implementations: H[]) {',
    '    this.implementations = implementations;',
    '  }',
  ]);
});

test('resolveDelegate without a context leaves it out of the errors', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'implscan-'));
  const file = path.join(dir, 'resolve.ts');
  writeFileSync(file, `${RESOLVE_DELEGATE_SOURCE.join('\n')}\nexport { resolveDelegate };\n`);
  const { resolveDelegate } = (await import(pathToFileURL(file).href)) as {
    resolveDelegate: <I>(owner: string, implementations: I[], context?: unknown) => I;
  };
  const impl = (applicable: boolean, priority: number) => ({ isApplicableTo: () => applicable, getPriority: () => priority });
  assert.throws(() => resolveDelegate('X', [impl(false, 0)]), /^Error: \[X\] No applicable implementation\. Available=Object\(priority=0\)$/);
  assert.throws(() => resolveDelegate('X', [impl(true, 1), impl(true, 1)]), /\[X\] Ambiguous implementations\. HighestPriority=1\./);
  const only = impl(true, 0);
  assert.equal(resolveDelegate('X', [only]), only);
});
