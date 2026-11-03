#!/usr/bin/env bash
# Packs the library, installs the tarball into an empty Angular-style project
# (bundler resolution) and runs the CLI from it. This proves that everything a
# consumer needs (bin, compiled CLI, ImplScan types, ts-morph) is in the package.
set -euo pipefail

root=$(pwd)
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

tarball=$(npm pack --silent --pack-destination "$tmp" | tail -1)
cd "$tmp"
npm init -y >/dev/null
npm install --silent --no-audit --no-fund "./$tarball"

mkdir -p src
cat > tsconfig.json <<'JSON'
{ "compilerOptions": { "module": "ES2022", "moduleResolution": "bundler", "strict": true } }
JSON
cat > src/greeter.ts <<'TS'
import type { ImplScan } from '@thomasrepnik/ts-implscan';
export interface Greeter extends ImplScan { greet(): string }
TS
cat > src/hello.ts <<'TS'
import type { Greeter } from './greeter';
export class Hello implements Greeter { greet() { return 'hello'; } }
TS

npx ts-implscan --target angular
out=src/generated/registry.ts
grep -q "import { Hello } from '../hello';" "$out"
grep -q "export const GREETER_LIST = new InjectionToken<Greeter\[\]>" "$out"
grep -q "{ provide: GREETER_LIST, useClass: Hello, multi: true }" "$out"

echo "package smoke test passed ($tarball)"
