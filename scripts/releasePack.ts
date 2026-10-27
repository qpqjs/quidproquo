// Packs every public workspace into <outDir> and writes <outDir>/manifest.json, in
// workspace order (the order `npm publish --ws` uses), for releasePublish.mts.
// Packing runs each package's prepack, so create-qpq-app snapshots its template here,
// in the job that has the monorepo installed.
// Usage: npx tsx ./scripts/releasePack.ts <outDir>

import { execFileSync } from 'child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';

import type { ReleasePackage } from './releasePackage';

const ROOT = join(__dirname, '..');

type PackageJson = {
  name: string;
  version: string;
  private?: boolean;
  workspaces?: string[];
};

const readPackageJson = (dir: string): PackageJson => JSON.parse(readFileSync(join(ROOT, dir, 'package.json'), 'utf8'));

// npm names a tarball `<name>-<version>.tgz`, with a scope's `@` dropped and its `/` turned into `-`.
const tarballName = (pkg: PackageJson): string => `${pkg.name.replace(/^@/, '').replace('/', '-')}-${pkg.version}.tgz`;

const main = () => {
  const outArg = process.argv[2];

  if (!outArg) {
    console.error('Usage: releasePack.ts <outDir>');
    process.exit(1);
  }

  const outDir = resolve(outArg);
  const workspaces = readPackageJson('.').workspaces ?? [];
  const packages = workspaces.map(readPackageJson).filter((pkg) => !pkg.private);

  mkdirSync(outDir, { recursive: true });
  execFileSync('npm', ['pack', '--ws', '--pack-destination', outDir], { cwd: ROOT, stdio: 'inherit' });

  const manifest: ReleasePackage[] = packages.map((pkg) => ({ name: pkg.name, version: pkg.version, tarball: tarballName(pkg) }));
  const missing = manifest.filter((pkg) => !existsSync(join(outDir, pkg.tarball)));

  if (missing.length > 0) {
    console.error(`npm pack did not produce: ${missing.map((pkg) => pkg.tarball).join(', ')}`);
    process.exit(1);
  }

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`packed ${manifest.length} packages into ${outDir}`);
};

main();
