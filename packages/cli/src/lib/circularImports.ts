// Source-level circular import detection over the consumer repo's npm
// workspaces, powered by madge (AST-based dependency graph + cycle detection).
// Complements the rspack CircularCheckRspackPlugin (which needs a bundle to
// run): this scans TypeScript sources directly, so it can run inside tsc-only
// flows like `npm run validate-ts` with no bundling.
//
// Scope: each workspace's src, relative imports. Cross-package cycles are
// already impossible — TypeScript project references refuse to build them — so
// every runtime-relevant cycle lives inside one package's src. Type-only
// imports are skipped (skipTypeImports): tsc erases them, so they never create
// a runtime cycle.
import fs from 'fs';
import path from 'path';

// madge ships no type definitions; declare the narrow slice we use.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const madge = require('madge') as (paths: string[], config: object) => Promise<{ circular(): string[][] }>;

export type ImportCycle = string[];

// Expand npm workspace globs (plain path segments and `*` segments only — the
// only forms npm workspaces use in practice) into existing directories.
const expandWorkspaceGlob = (root: string, pattern: string): string[] => {
  let candidates = [root];

  for (const segment of pattern.split('/')) {
    if (segment === '*') {
      candidates = candidates.flatMap((dir) =>
        fs.existsSync(dir)
          ? fs
              .readdirSync(dir, { withFileTypes: true })
              .filter((entry) => entry.isDirectory())
              .map((entry) => path.join(dir, entry.name))
          : [],
      );
    } else {
      candidates = candidates.map((dir) => path.join(dir, segment));
    }
  }

  return candidates.filter((dir) => fs.existsSync(dir) && fs.statSync(dir).isDirectory());
};

export const getWorkspaceDirectories = (root: string): string[] => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const patterns: string[] = packageJson.workspaces ?? [];
  return patterns.flatMap((pattern) => expandWorkspaceGlob(root, pattern));
};

export const findWorkspaceImportCycles = async (root: string): Promise<ImportCycle[]> => {
  const sourceDirs = getWorkspaceDirectories(root)
    .map((dir) => path.join(dir, 'src'))
    .filter((dir) => fs.existsSync(dir));

  // Excludes: node_modules and built output (dist/lib), declaration files
  // (type-only, can't cycle at runtime), and anything madge resolves to outside
  // the repo root (linked framework packages — their cycles surface through the
  // rspack CircularCheckRspackPlugin instead, this command owns the consumer
  // repo). Out-of-root paths start with '..' because baseDir is the repo root.
  const result = await madge(sourceDirs, {
    baseDir: root,
    fileExtensions: ['ts', 'tsx'],
    excludeRegExp: [/node_modules/, /(^|\/)(dist|lib)\//, /\.d\.ts$/, /^\.\./],
    detectiveOptions: {
      ts: { skipTypeImports: true },
      tsx: { skipTypeImports: true },
    },
  });

  return result.circular();
};
