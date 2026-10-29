// Every sibling package a workspace imports must be declared: a production import in
// `dependencies` (or `peerDependencies`), a test-only import in `devDependencies` (H3).
import fs from 'fs';
import path from 'path';

const root = path.resolve(__dirname, '..');
const packagesDir = path.join(root, 'packages');
const siblingImport = /from ['"](@qpqjs\/[a-z-]+|quidproquo|create-qpq-app)(?:\/[^'"]*)?['"]/g;

const listSourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : listSourceFiles(full);
    return /\.(ts|tsx|mts|js|mjs)$/.test(entry.name) ? [full] : [];
  });

const isTestFile = (file: string): boolean => /\.test\.[jt]sx?$/.test(file) || /[\\/](testing|__fixtures__|integration)[\\/]/.test(file);

let failures = 0;
for (const folder of fs.readdirSync(packagesDir)) {
  const manifestPath = path.join(packagesDir, folder, 'package.json');
  const srcDir = path.join(packagesDir, folder, 'src');
  if (!fs.existsSync(manifestPath) || !fs.existsSync(srcDir)) continue;

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const production = new Set([...Object.keys(manifest.dependencies ?? {}), ...Object.keys(manifest.peerDependencies ?? {})]);
  const development = new Set(Object.keys(manifest.devDependencies ?? {}));

  const productionImports = new Set<string>();
  const testImports = new Set<string>();
  for (const file of listSourceFiles(srcDir)) {
    const names = [...fs.readFileSync(file, 'utf8').matchAll(siblingImport)]
      .map((match) => match[1] as string)
      .filter((name) => name !== manifest.name);
    for (const name of names) (isTestFile(file) ? testImports : productionImports).add(name);
  }

  for (const name of [...productionImports].sort()) {
    if (!production.has(name)) {
      console.error(`${manifest.name}: imports ${name} in production code but does not list it in dependencies`);
      failures += 1;
    }
  }
  for (const name of [...testImports].sort()) {
    if (!productionImports.has(name) && !development.has(name) && !production.has(name)) {
      console.error(`${manifest.name}: imports ${name} only in tests but does not list it in devDependencies`);
      failures += 1;
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} undeclared sibling import(s)`);
  process.exit(1);
}
console.log('every sibling import is declared');
