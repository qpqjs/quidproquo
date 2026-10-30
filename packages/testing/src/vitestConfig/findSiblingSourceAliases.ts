import fs from 'node:fs';
import path from 'node:path';

/**
 * Maps every sibling workspace package (a folder next to `packageDir` with a `package.json` and a
 * `src/index.ts`) from its package name to its `src` folder, so tests resolve siblings to source
 * instead of the last-built `lib`. Subpath imports such as `@qpqjs/dev-server/config` resolve too,
 * because the alias points at the folder rather than at `index.ts`.
 */
export function findSiblingSourceAliases(packageDir: string): Record<string, string> {
  const workspaceDir = path.dirname(packageDir);
  const aliases: Record<string, string> = {};

  for (const folder of fs.readdirSync(workspaceDir).sort()) {
    const siblingDir = path.join(workspaceDir, folder);
    const packageJsonPath = path.join(siblingDir, 'package.json');
    const sourceDir = path.join(siblingDir, 'src');

    const hasSourceEntry = ['index.ts', 'index.tsx'].some((entry) => fs.existsSync(path.join(sourceDir, entry)));
    if (!fs.existsSync(packageJsonPath) || !hasSourceEntry) {
      continue;
    }

    const packageName = (JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { name?: string }).name;
    if (packageName) {
      aliases[packageName] = sourceDir;
    }
  }

  return aliases;
}
