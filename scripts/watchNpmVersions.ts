// Polls the npm registry for every public workspace package and redraws a table of
// local vs published versions until the registry has caught up with this repo.
// Registry propagation after `npm publish` can lag by minutes, so this exists to
// answer "is it there yet?" without hammering the npm website by hand.
// Pass --once for a single snapshot (exit code 1 if anything is still behind).

import { readFileSync } from 'fs';
import { join } from 'path';

const ROOT = join(__dirname, '..');
const POLL_MS = Number(process.env.POLL_MS ?? 5000);
const ONCE = process.argv.includes('--once');

type PackageInfo = {
  name: string;
  version: string;
};

type PackageStatus = PackageInfo & {
  published: string;
  error?: string;
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

// The install-v1 accept header returns the abbreviated metadata document, which is a
// fraction of the size of the full packument and is served from a faster cache tier.
const fetchPublishedVersion = async (name: string): Promise<string> => {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
    headers: {
      accept: 'application/vnd.npm.install-v1+json',
      'cache-control': 'no-cache',
    },
  });

  if (response.status === 404) {
    return '(unpublished)';
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const body = (await response.json()) as { 'dist-tags'?: Record<string, string> };
  return body['dist-tags']?.latest ?? '(no latest tag)';
};

const fetchStatus = async (pkg: PackageInfo): Promise<PackageStatus> => {
  try {
    return { ...pkg, published: await fetchPublishedVersion(pkg.name) };
  } catch (error) {
    return { ...pkg, published: '?', error: error instanceof Error ? error.message : String(error) };
  }
};

const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';

// Semver-ish compare on numeric segments; non-numeric values (unpublished, errors)
// sort as lowest so they sink to the bottom with the stragglers.
const compareVersions = (a: string, b: string): number => {
  const parse = (v: string): number[] => (/^\d+(\.\d+)*$/.test(v) ? v.split('.').map(Number) : [-1]);
  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) {
      return diff;
    }
  }
  return 0;
};

const render = (statuses: PackageStatus[], attempt: number, startMs: number): void => {
  const nameWidth = Math.max(...statuses.map((s) => s.name.length));
  const ordered = [...statuses].sort((a, b) => compareVersions(b.published, a.published) || a.name.localeCompare(b.name));
  const lines = ordered.map((s) => {
    const matches = s.published === s.version;
    const colour = s.error ? RED : matches ? GREEN : YELLOW;
    const mark = s.error ? '!' : matches ? '✓' : '…';
    const detail = s.error ? ` ${DIM}${s.error}${RESET}` : '';
    return `${colour}${mark}${RESET} ${s.name.padEnd(nameWidth)}  local ${s.version}  npm ${colour}${s.published}${RESET}${detail}`;
  });

  const matched = statuses.filter((s) => s.published === s.version).length;
  const elapsed = ((Date.now() - startMs) / 1000).toFixed(0);

  if (process.stdout.isTTY && !ONCE) {
    process.stdout.write('\x1b[2J\x1b[H');
  }
  console.log(`${DIM}poll #${attempt}  ${matched}/${statuses.length} published  ${elapsed}s elapsed${RESET}\n`);
  console.log(lines.join('\n'));
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const main = async (): Promise<void> => {
  const packages = loadWorkspacePackages();
  const startMs = Date.now();

  for (let attempt = 1; ; attempt++) {
    const statuses = await Promise.all(packages.map(fetchStatus));
    render(statuses, attempt, startMs);

    if (statuses.every((s) => s.published === s.version)) {
      console.log(`\n${GREEN}All ${statuses.length} packages are live on npm.${RESET}`);
      return;
    }

    if (ONCE) {
      process.exit(1);
    }

    await sleep(POLL_MS);
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
