set -e
npm pkg set scripts.generate="ts-implscan --target angular --project tsconfig.app.json --out src/app/generated/implscan-registry.ts"
npm run --silent generate
