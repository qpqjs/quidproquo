// Points quidproquojs.com at the published qpq packages instead of the monorepo. Every
// `file:../packages/<x>` dependency in the site's package.json becomes the exact version the
// monorepo's package.json files carry (the version a release just published), then the site is
// reinstalled so npm fetches those packages from the registry. Nothing it writes is committed:
// the release deploy and a manual `from_npm` run use it on a throwaway checkout, and local
// development keeps the file links.
// Usage: npx tsx ./scripts/sitePinQpq.ts [--dry-run]
//   --dry-run  print what would change and write nothing

import { execFileSync } from 'child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..');
const SITE = join(ROOT, 'quidproquojs.com');
const FILE_LINK_PREFIX = 'file:../packages/';

type Dependencies = Record<string, string>;

export type PackageInfo = {
  name: string;
  version: string;
};

export type SitePackageJson = {
  dependencies?: Dependencies;
  devDependencies?: Dependencies;
  [key: string]: unknown;
};

export type PinResult = {
  packageJson: SitePackageJson;
  version: string;
  pinned: string[];
};

const readJson = (path: string): Record<string, any> => JSON.parse(readFileSync(path, 'utf8'));

const loadWorkspacePackages = (): PackageInfo[] => {
  const root = readJson(join(ROOT, 'package.json'));
  const workspaces: string[] = root.workspaces ?? [];

  return workspaces
    .map((ws) => readJson(join(ROOT, ws, 'package.json')))
    .filter((pkg) => !pkg.private)
    .map((pkg) => ({ name: pkg.name, version: pkg.version }));
};

// The one version every public package carries after a bump. Two versions means a half
// applied bump, and pinning the site to either would be a guess.
const resolveVersion = (packages: PackageInfo[]): string => {
  const versions = [...new Set(packages.map((pkg) => pkg.version))];
  const [version] = versions;

  if (versions.length !== 1 || version === undefined) {
    throw new Error(`The public packages carry ${versions.length} versions (${versions.join(', ')}); expected exactly one`);
  }

  return version;
};

const pinDependencies = (dependencies: Dependencies | undefined, published: Map<string, string>, pinned: string[]): Dependencies | undefined => {
  if (!dependencies) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(dependencies).map(([name, spec]) => {
      if (!spec.startsWith(FILE_LINK_PREFIX)) {
        return [name, spec];
      }

      const version = published.get(name);
      if (version === undefined) {
        throw new Error(`${name} is linked from the monorepo (${spec}) but is not a public workspace package, so npm cannot serve it`);
      }

      pinned.push(name);
      return [name, version];
    }),
  );
};

/** Pure: the site's package.json with every monorepo file link replaced by the published version. */
export const pinSitePackageJson = (site: SitePackageJson, packages: PackageInfo[]): PinResult => {
  const version = resolveVersion(packages);
  const published = new Map(packages.map((pkg) => [pkg.name, pkg.version]));
  const pinned: string[] = [];

  const packageJson: SitePackageJson = {
    ...site,
    dependencies: pinDependencies(site.dependencies, published, pinned),
    devDependencies: pinDependencies(site.devDependencies, published, pinned),
  };

  if (pinned.length === 0) {
    throw new Error(`quidproquojs.com has no ${FILE_LINK_PREFIX} dependencies to pin`);
  }

  return { packageJson, version, pinned };
};

const main = (): void => {
  const dryRun = process.argv.includes('--dry-run');
  const sitePackageJsonPath = join(SITE, 'package.json');

  const { packageJson, version, pinned } = pinSitePackageJson(readJson(sitePackageJsonPath), loadWorkspacePackages());

  console.log(`${dryRun ? 'Would pin' : 'Pinning'} ${pinned.length} package(s) in quidproquojs.com to ${version}:`);
  pinned.forEach((name) => console.log(`  ${name}`));

  if (dryRun) {
    return;
  }

  writeFileSync(sitePackageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, 'utf8');

  // The committed lockfile goes. It describes the file link graph, and that graph is not a
  // standalone one: the links' own dependencies (express's `qs`, say) resolve from the monorepo
  // root's node_modules and are not in the site's lockfile at all. Reusing it with the links
  // swapped for registry packages leaves those dependencies out (the first release deploy died
  // on `Cannot find module 'qs'`), and keeping the links is worse: npm holds a link whose target
  // satisfies the new spec, which an unbuilt release checkout does, and installs no lib and no
  // bins. So: no lockfile, every pinned package as an explicit `name@version` spec, and npm
  // resolves the whole tree from the registry the way a user's project would.
  rmSync(join(SITE, 'package-lock.json'), { force: true });
  const specs = pinned.map((name) => `${name}@${version}`);
  execFileSync('npm', ['install', '--no-audit', '--no-fund', '--save-exact', ...specs], { cwd: SITE, stdio: 'inherit' });

  // The one bin the deploy runs. Missing means the packages did not really come from npm.
  const qpqBin = join(SITE, 'node_modules', '.bin', 'qpq');
  if (!existsSync(qpqBin)) {
    throw new Error(`${qpqBin} is missing after the install, so @qpqjs/cli did not come from the registry`);
  }
};

if (require.main === module) {
  main();
}
