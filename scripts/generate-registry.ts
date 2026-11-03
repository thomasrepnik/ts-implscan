// Build-time "component scan": finds every exported interface that extends the
// `ImplScan` marker, then every exported class that implements one of them, and
// writes one array of implementations per interface. With `--target angular` it
// also writes an InjectionToken per interface and `provideImplscan()`.
//
// Usage: node scripts/generate-registry.ts [--project tsconfig.json] [--src src]
//          [--out src/generated/registry.ts] [--target plain|angular] [--dry-run]
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { type ExpressionWithTypeArguments, type InterfaceDeclaration, Node, Project, ts } from 'ts-morph';

const MARKER = 'ImplScan';

const { values: args } = parseArgs({
  options: {
    project: { type: 'string', default: 'tsconfig.json' },
    src: { type: 'string', default: 'src' },
    out: { type: 'string', default: 'src/generated/registry.ts' },
    target: { type: 'string', default: 'plain' },
    'dry-run': { type: 'boolean', default: false },
  },
});
if (args.target !== 'plain' && args.target !== 'angular') {
  console.error(`unknown --target '${args.target}', expected 'plain' or 'angular'`);
  process.exit(1);
}

const outFile = path.resolve(args.out);
const outDir = path.dirname(outFile);

// Use the tsconfig only for compiler options (paths, module resolution). Files come from
// a glob, because new implementations are not imported anywhere yet (Angular's
// tsconfig.app.json only lists main.ts).
const project = new Project({ tsConfigFilePath: args.project, skipAddingFilesFromTsConfig: true });
project.addSourceFilesAtPaths([`${args.src}/**/*.ts`, `!${args.src}/**/*.spec.ts`, `!${args.src}/**/*.d.ts`]);
const sourceFiles = project.getSourceFiles().filter((f) => f.getFilePath() !== outFile);

// Pick the import extension the tsconfig expects: `.ts` (Node type stripping),
// `.js` (NodeNext) or none (Angular's `bundler` resolution).
const options = project.getCompilerOptions();
const importExt = options.allowImportingTsExtensions
  ? '.ts'
  : options.moduleResolution === ts.ModuleResolutionKind.Node16 ||
      options.moduleResolution === ts.ModuleResolutionKind.NodeNext
    ? '.js'
    : '';

// resolve through the type checker so aliased/renamed imports still match
function resolveInterface(clause: ExpressionWithTypeArguments) {
  let symbol = clause.getExpression().getSymbol();
  if (symbol?.isAlias()) symbol = symbol.getAliasedSymbol();
  return symbol?.getDeclarations().find(Node.isInterfaceDeclaration);
}

const keyOf = (decl: InterfaceDeclaration) => `${decl.getSourceFile().getFilePath()}#${decl.getName()}`;

type Ref = { name: string; file: string };
const registry = new Map<string, { iface: Ref; impls: Ref[] }>();

// 1. interfaces that opt in by extending the marker directly
for (const sourceFile of sourceFiles) {
  for (const iface of sourceFile.getInterfaces()) {
    if (!iface.isExported()) continue;
    if (!iface.getExtends().some((clause) => resolveInterface(clause)?.getName() === MARKER)) continue;
    registry.set(keyOf(iface), { iface: { name: iface.getName(), file: sourceFile.getFilePath() }, impls: [] });
  }
}

// 2. classes implementing one of those interfaces
for (const sourceFile of sourceFiles) {
  for (const cls of sourceFile.getClasses()) {
    const name = cls.getName();
    if (!name || cls.isAbstract()) continue;

    for (const clause of cls.getImplements()) {
      const decl = resolveInterface(clause);
      const entry = decl && registry.get(keyOf(decl));
      if (!entry) continue;
      if (!cls.isExported() || cls.isDefaultExport()) {
        console.warn(`skipped ${name} (${path.relative(process.cwd(), sourceFile.getFilePath())}): needs a named export`);
        continue;
      }
      entry.impls.push({ name, file: sourceFile.getFilePath() });
    }
  }
}

function importPath(file: string) {
  const rel = path.relative(outDir, file).split(path.sep).join('/').replace(/\.ts$/, importExt);
  return rel.startsWith('.') ? rel : `./${rel}`;
}

// PaymentHandler -> PAYMENT_HANDLER_LIST
function tokenName(interfaceName: string) {
  const snake = interfaceName.replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z])([A-Z][a-z])/g, '$1_$2');
  return `${snake.toUpperCase()}_LIST`;
}

const angular = args.target === 'angular';
const imports: string[] = angular ? [`import { InjectionToken, type Provider } from '@angular/core';`] : [];
const exports: string[] = [];
const providers: string[] = [];
const entries = [...registry.values()].sort((a, b) => a.iface.name.localeCompare(b.iface.name));

for (const { iface, impls } of entries) {
  impls.sort((a, b) => a.name.localeCompare(b.name));
  imports.push(`import type { ${iface.name} } from '${importPath(iface.file)}';`);
  for (const impl of impls) imports.push(`import { ${impl.name} } from '${importPath(impl.file)}';`);
  // same shape as Angular's Type<T>, so it can be used directly as `useClass`
  exports.push(
    `export const ${iface.name}Implementations: Array<new (...args: any[]) => ${iface.name}> = [${impls.map((i) => i.name).join(', ')}];`,
  );

  if (angular) {
    const token = tokenName(iface.name);
    exports.push(`export const ${token} = new InjectionToken<${iface.name}[]>('${token}');`);
    // a multi token without any provider would throw on inject(), so fall back to []
    if (impls.length === 0) providers.push(`    { provide: ${token}, useValue: [] },`);
    for (const impl of impls) providers.push(`    { provide: ${token}, useClass: ${impl.name}, multi: true },`);
  }
}

if (angular) {
  exports.push('', 'export function provideImplscan(): Provider[] {', '  return [', ...providers, '  ];', '}');
}

const content = ['// GENERATED by scripts/generate-registry.ts – do not edit', ...imports, '', ...exports, ''].join('\n');

if (args['dry-run']) {
  console.log(content);
} else {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, content);
  for (const { iface, impls } of entries) console.log(`${iface.name}: ${impls.map((i) => i.name).join(', ') || '(none)'}`);
  console.log(`wrote ${path.relative(process.cwd(), outFile)}`);
}
