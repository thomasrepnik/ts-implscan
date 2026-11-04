import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Project, ScriptTarget } from 'ts-morph';
import { analyzeDispatcher, type DispatcherAnalysis, DISPATCH_MARKER, TypeImports } from '../src/dispatcher.ts';

const MARKER_FILE = `export interface ImplScan {}
export interface Dispatchable<T> extends ImplScan { isApplicableTo(context: T): boolean; getPriority(): number; }`;

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
  ['missing type argument', `export interface H extends Dispatchable { run(): void }`, /type argument/],
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
