// Polls the npm registry for every public workspace package and redraws a table of
// local vs published versions until the registry serves every local version.
// Registry propagation after `npm publish` can lag by minutes, so this exists to
// answer "is it there yet?" without hammering the npm website by hand.
// A package counts as published once its local version is among the versions npm
// serves, not only when it is `latest`: a deploy pinned to an older release (a
// branch trial, a rerun after a newer release) must not wait on a tag that will
// never move back. The table still shows `latest`, since that is what a person
// polling after a publish wants to see.
// Pass --once for a single snapshot (exit code 1 if anything is still behind).

import { readFileSync } from 'fs';
import { join } from 'path';

import { renderBar } from './progressBar';

const ROOT = join(__dirname, '..');
const POLL_MS = Number(process.env.POLL_MS ?? 5000);
const ONCE = process.argv.includes('--once');

type PackageInfo = {
  name: string;
  version: string;
};

type PackageStatus = PackageInfo & {
  // npm's `latest` tag, for the table.
  published: string;
  // Whether npm serves the local version at all.
  available: boolean;
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
const fetchPublished = async (name: string): Promise<{ latest: string; versions: string[] }> => {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
    headers: {
      accept: 'application/vnd.npm.install-v1+json',
      'cache-control': 'no-cache',
    },
  });

  if (response.status === 404) {
    return { latest: '(unpublished)', versions: [] };
  }

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const body = (await response.json()) as { 'dist-tags'?: Record<string, string>; versions?: Record<string, unknown> };
  return { latest: body['dist-tags']?.latest ?? '(no latest tag)', versions: Object.keys(body.versions ?? {}) };
};

const fetchStatus = async (pkg: PackageInfo): Promise<PackageStatus> => {
  try {
    const { latest, versions } = await fetchPublished(pkg.name);
    return { ...pkg, published: latest, available: versions.includes(pkg.version) };
  } catch (error) {
    return { ...pkg, published: '?', available: false, error: error instanceof Error ? error.message : String(error) };
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

const renderProgress = (matched: number, total: number): string => {
  const ratio = total === 0 ? 1 : matched / total;
  const colour = matched === total ? GREEN : YELLOW;
  const pct = String(Math.round(ratio * 100)).padStart(3);
  return `${colour}[${renderBar(ratio)}]${RESET} ${pct}%  ${matched}/${total} published`;
};

const render = (statuses: PackageStatus[], attempt: number, startMs: number): void => {
  const nameWidth = Math.max(...statuses.map((s) => s.name.length));
  const ordered = [...statuses].sort((a, b) => compareVersions(b.published, a.published) || a.name.localeCompare(b.name));
  const lines = ordered.map((s) => {
    const matches = s.available;
    const colour = s.error ? RED : matches ? GREEN : YELLOW;
    const mark = s.error ? '!' : matches ? '✓' : '…';
    const detail = s.error ? ` ${DIM}${s.error}${RESET}` : '';
    return `${colour}${mark}${RESET} ${s.name.padEnd(nameWidth)}  local ${s.version}  npm ${colour}${s.published}${RESET}${detail}`;
  });

  const matched = statuses.filter((s) => s.available).length;
  const elapsed = ((Date.now() - startMs) / 1000).toFixed(0);

  if (process.stdout.isTTY && !ONCE) {
    process.stdout.write('\x1b[2J\x1b[H');
  }
  console.log(`${DIM}poll #${attempt}  ${matched}/${statuses.length} published  ${elapsed}s elapsed${RESET}\n`);
  console.log(lines.join('\n'));
  console.log(`\n${renderProgress(matched, statuses.length)}`);
};

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const main = async (): Promise<void> => {
  const packages = loadWorkspacePackages();
  const startMs = Date.now();

  for (let attempt = 1; ; attempt++) {
    const statuses = await Promise.all(packages.map(fetchStatus));
    render(statuses, attempt, startMs);

    if (statuses.every((s) => s.available)) {
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
