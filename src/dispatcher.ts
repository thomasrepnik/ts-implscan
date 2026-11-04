// Turns one `Dispatchable<TContext>` interface into a dispatcher class: the member
// signatures copied from the interface, the imports those signatures need, or a reason
// why the interface can't get a dispatcher.
import {
  type ExpressionWithTypeArguments,
  type Identifier,
  type ImportDeclaration,
  type InterfaceDeclaration,
  Node,
  SyntaxKind,
} from 'ts-morph';

export const DISPATCH_MARKER = 'Dispatchable';

/** Type-only imports of a generated file, keyed by local name so that a name is never bound twice. */
export class TypeImports {
  private readonly reserved: Set<string>;
  // local name -> `${specifier}\0${imported name}` (`*` for a namespace import)
  private readonly locals = new Map<string, string>();

  constructor(reserved: Iterable<string> = []) {
    this.reserved = new Set(reserved);
  }

  add(specifier: string, name: string, alias?: string): string | undefined {
    return this.bind(alias ?? name, `${specifier}\0${name}`);
  }

  addNamespace(specifier: string, alias: string): string | undefined {
    return this.bind(alias, `${specifier}\0*`);
  }

  /** Adds every import of `other`; on a collision nothing is added. */
  merge(other: TypeImports): string | undefined {
    for (const [local, key] of other.locals) {
      const error = this.check(local, key);
      if (error) return error;
    }
    for (const [local, key] of other.locals) this.locals.set(local, key);
    return undefined;
  }

  render(): string[] {
    const named = new Map<string, string[]>();
    const namespaces = new Map<string, string[]>();
    for (const [local, key] of [...this.locals].sort(([a], [b]) => a.localeCompare(b))) {
      const [specifier, name] = key.split('\0') as [string, string];
      if (name === '*') {
        namespaces.set(specifier, [...(namespaces.get(specifier) ?? []), local]);
      } else {
        named.set(specifier, [...(named.get(specifier) ?? []), name === local ? local : `${name} as ${local}`]);
      }
    }
    const specifiers = [...new Set([...named.keys(), ...namespaces.keys()])].sort();
    const lines: string[] = [];
    for (const specifier of specifiers) {
      const names = named.get(specifier);
      if (names) lines.push(`import type { ${names.join(', ')} } from '${specifier}';`);
      for (const alias of namespaces.get(specifier) ?? []) lines.push(`import type * as ${alias} from '${specifier}';`);
    }
    return lines;
  }

  private bind(local: string, key: string): string | undefined {
    const error = this.check(local, key);
    if (!error) this.locals.set(local, key);
    return error;
  }

  private check(local: string, key: string): string | undefined {
    if (this.reserved.has(local)) return `type ${local} clashes with another import of the generated file`;
    const existing = this.locals.get(local);
    if (existing !== undefined && existing !== key) {
      return `type ${local} would be imported from both '${existing.split('\0')[0]}' and '${key.split('\0')[0]}'`;
    }
    return undefined;
  }
}

export interface DispatcherMember {
  kind: 'method' | 'property';
  name: string;
  /** method: `pay(amount: number): string` (incl. type parameters); property: its type text */
  signature: string;
  /** method: the forwarding argument list, e.g. `level, ...parts`; property: '' */
  args: string;
  returnsVoid: boolean;
  readonly: boolean;
}

export interface DispatcherModel {
  interfaceName: string;
  className: string;
  contextType: string;
  /** without isApplicableTo / getPriority, in declaration order */
  members: DispatcherMember[];
  /** everything the copied texts need, including the interface and the context type */
  imports: TypeImports;
}

export type DispatcherAnalysis = { ok: true; model: DispatcherModel } | { ok: false; reason: string };

export function analyzeDispatcher(
  iface: InterfaceDeclaration,
  marker: ExpressionWithTypeArguments,
  importPath: (file: string) => string,
  reserved: Iterable<string>,
): DispatcherAnalysis {
  const interfaceName = iface.getName();
  const fail = (reason: string): DispatcherAnalysis => ({ ok: false, reason: `${interfaceName}: ${reason}` });
  const imports = new TypeImports(reserved);
  const collect = (node: Node | undefined) => (node ? collectImports(node, imports, importPath) : undefined);

  const typeArg = marker.getTypeArguments()[0];
  if (!typeArg) return fail(`${DISPATCH_MARKER} needs a type argument`);
  let error = imports.add(importPath(iface.getSourceFile().getFilePath()), interfaceName) ?? collect(typeArg);
  if (error) return fail(error);

  const members: DispatcherMember[] = [];
  for (const symbol of iface.getType().getProperties()) {
    const decl = symbol.getDeclarations()[0]!;
    const owner = decl.getParent();
    if (Node.isInterfaceDeclaration(owner) && owner.getName() === DISPATCH_MARKER) continue;

    if (Node.isMethodSignature(decl)) {
      const typeParams = decl.getTypeParameters();
      const params = decl.getParameters();
      const returnNode = decl.getReturnTypeNode();
      const generics = typeParams.length ? `<${typeParams.map((t) => t.getText()).join(', ')}>` : '';
      const returnText = returnNode?.getText() ?? decl.getReturnType().getText(decl);
      for (const node of [...typeParams, ...params.map((p) => p.getTypeNode()), returnNode]) {
        error = collect(node);
        if (error) return fail(`${error} (used by ${decl.getName()})`);
      }
      members.push({
        kind: 'method',
        name: decl.getName(),
        signature: `${decl.getName()}${generics}(${params.map((p) => p.getText()).join(', ')}): ${returnText}`,
        args: params.map((p) => `${p.isRestParameter() ? '...' : ''}${p.getName()}`).join(', '),
        returnsVoid: returnNode?.getKind() === SyntaxKind.VoidKeyword,
        readonly: false,
      });
    } else if (Node.isPropertySignature(decl)) {
      const typeNode = decl.getTypeNode();
      error = collect(typeNode);
      if (error) return fail(`${error} (used by ${decl.getName()})`);
      members.push({
        kind: 'property',
        name: decl.getName(),
        signature: typeNode?.getText() ?? decl.getType().getText(decl),
        args: '',
        returnsVoid: false,
        readonly: decl.isReadonly(),
      });
    }
  }

  return {
    ok: true,
    model: { interfaceName, className: `${interfaceName}Dispatcher`, contextType: typeArg.getText(), members, imports },
  };
}

// Every type name referenced inside `node` becomes an import of the generated file.
function collectImports(node: Node, imports: TypeImports, importPath: (file: string) => string): string | undefined {
  for (const n of [node, ...node.getDescendants()]) {
    let entity: Node | undefined;
    if (Node.isTypeReference(n)) entity = n.getTypeName();
    else if (Node.isTypeQuery(n)) entity = n.getExprName();
    if (!entity) continue;
    while (Node.isQualifiedName(entity)) entity = entity.getLeft();
    const error = importFor(entity as Identifier, imports, importPath);
    if (error) return error;
  }
  return undefined;
}

function importFor(id: Identifier, imports: TypeImports, importPath: (file: string) => string): string | undefined {
  const text = id.getText();
  const file = id.getSourceFile();

  // 1. bound by an import of the declaring file: reuse it
  for (const imp of file.getImportDeclarations()) {
    const specifier = () => specifierOf(imp, importPath);
    if (imp.getNamespaceImport()?.getText() === text) return imports.addNamespace(specifier(), text);
    if (imp.getDefaultImport()?.getText() === text) return imports.add(specifier(), 'default', text);
    for (const named of imp.getNamedImports()) {
      const alias = named.getAliasNode()?.getText();
      if ((alias ?? named.getName()) === text) return imports.add(specifier(), named.getName(), alias);
    }
  }

  const declarations = id.getSymbol()?.getDeclarations() ?? [];
  // 2. a type parameter needs no import
  if (declarations.some(Node.isTypeParameterDeclaration)) return undefined;
  // 3. declared in the declaring file itself
  const local = declarations.find((d) => d.getSourceFile() === file && Node.isSourceFile(d.getParent()));
  if (local) return imports.add(importPath(file.getFilePath()), text);
  // 4. globals and ambient declarations
  return undefined;
}

function specifierOf(imp: ImportDeclaration, importPath: (file: string) => string): string {
  if (!imp.isModuleSpecifierRelative()) return imp.getModuleSpecifierValue();
  const target = imp.getModuleSpecifierSourceFile();
  if (!target) throw new Error(`cannot resolve import '${imp.getModuleSpecifierValue()}' in ${imp.getSourceFile().getFilePath()}`);
  return importPath(target.getFilePath());
}
