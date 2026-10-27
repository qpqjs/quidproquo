import fs from 'fs';
import path from 'path';

// Minimal glob expansion for workspace patterns (segments of literals and `*`);
// avoids a glob dependency for the only shapes npm workspaces use here.
const expandWorkspacePattern = (root: string, pattern: string): string[] => {
  let dirs = [root];

  for (const segment of pattern.split('/')) {
    if (segment === '*') {
      dirs = dirs.flatMap((dir) =>
        fs.existsSync(dir)
          ? fs
              .readdirSync(dir, { withFileTypes: true })
              .filter((entry) => entry.isDirectory())
              .map((entry) => path.join(dir, entry.name))
          : [],
      );
    } else {
      dirs = dirs.map((dir) => path.join(dir, segment)).filter((dir) => fs.existsSync(dir));
    }
  }

  return dirs;
};

/**
 * Every workspace package directory (expanded from the root package.json
 * workspace globs) that actually holds a package.json.
 */
export const getWorkspacePackageDirs = (root: string): string[] => {
  const rootPackageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf-8'));
  const workspaceGlobs: string[] = rootPackageJson.workspaces || [];

  return workspaceGlobs.flatMap((pattern) => expandWorkspacePattern(root, pattern)).filter((dir) => fs.existsSync(path.join(dir, 'package.json')));
};
