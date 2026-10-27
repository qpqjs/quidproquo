// Publishes the tarballs releasePack.ts made, skipping any version already on npm, so a
// failed publish job can be rerun and carries on where it stopped.
// Runs under plain `node` (it strips the types itself), with nothing installed, so no
// third-party code runs in the job that can mint an npm publish token. Keep it to
// erasable TypeScript and node builtins. `.mts` so node loads it as ESM without
// guessing (and warning) from the root package.json, which has no "type".
// Usage: node ./scripts/releasePublish.mts <releaseDir>

import { execFileSync } from 'child_process';
import { readFileSync } from 'fs';
import { join, resolve } from 'path';

import type { ReleasePackage } from './releasePackage';

// The install-v1 accept header returns the abbreviated metadata document, a fraction of
// the full packument. no-cache so a rerun sees versions published minutes earlier.
const fetchPublishedVersions = async (name: string): Promise<string[] | null> => {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
    headers: {
      accept: 'application/vnd.npm.install-v1+json',
      'cache-control': 'no-cache',
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`npm registry returned ${response.status} for ${name}`);
  }

  const body = (await response.json()) as { versions?: Record<string, unknown> };

  return Object.keys(body.versions ?? {});
};

const main = async () => {
  const dirArg = process.argv[2];

  if (!dirArg) {
    console.error('Usage: releasePublish.mts <releaseDir>');
    process.exit(1);
  }

  const releaseDir = resolve(dirArg);
  const packages: ReleasePackage[] = JSON.parse(readFileSync(join(releaseDir, 'manifest.json'), 'utf8'));
  const toPublish: ReleasePackage[] = [];
  const notOnNpm: string[] = [];

  for (const pkg of packages) {
    const versions = await fetchPublishedVersions(pkg.name);

    if (!versions) {
      notOnNpm.push(pkg.name);
    } else if (versions.includes(pkg.version)) {
      console.log(`${pkg.name}@${pkg.version} is already on npm, skipping`);
    } else {
      toPublish.push(pkg);
    }
  }

  // Trusted publishing only works for a package that already exists on npm, so a new
  // one would fail partway through the release. Stop before publishing anything.
  if (notOnNpm.length > 0) {
    console.error(`Not on npm yet: ${notOnNpm.join(', ')}`);
    console.error('Publish the first version of each by hand (npm publish -w <name>), add the trusted publisher on npmjs.com, then rerun this job.');
    process.exit(1);
  }

  for (const pkg of toPublish) {
    console.log(`publishing ${pkg.name}@${pkg.version}`);
    execFileSync('npm', ['publish', join(releaseDir, pkg.tarball)], { stdio: 'inherit' });
  }

  console.log(`published ${toPublish.length}, skipped ${packages.length - toPublish.length}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
