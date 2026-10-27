import fs from 'fs';
import path from 'path';

// The `// federated.export` marker system: single source of truth for module
// federation exposes:
//  - any .ts/.tsx/.js/.jsx file whose content CONTAINS the substring `// federated.export`
//    is exposed as `./<basename-without-ext>` -> `./src/<relative-path>`
//  - a file NAMED `federated.export` marks its directory as an expose: the key is
//    the trimmed file contents (or the directory name when empty), the value is
//    the directory itself.
const FEDERATED_EXPORT_COMMENT = '// federated.export';
const FEDERATED_EXPORT_FILE = 'federated.export';
const SKIP_DIRS = new Set(['dist', 'dist-tsc', 'node_modules', '.git', 'coverage', '@mf-types']);

export type FederatedExposes = Record<string, string>;

// Scan a views project dir for federated exports. Returns exposes keyed
// `./Name` -> `./src/relative/path.tsx` (paths relative to the views dir).
export const scanFederatedExposes = (viewsDir: string): FederatedExposes => {
  const srcDir = path.join(viewsDir, 'src');
  const exposes: FederatedExposes = {};
  if (!fs.existsSync(srcDir)) return exposes;

  const walk = (dir: string): void => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(full);
        continue;
      }
      const relFromSrc = path.relative(srcDir, full).split(path.sep).join('/');

      if (entry.name === FEDERATED_EXPORT_FILE) {
        const contents = fs.readFileSync(full, 'utf8').trim();
        const exposeDir = path.dirname(relFromSrc);
        const key = contents || path.basename(exposeDir);
        exposes[`./${key}`] = `./src/${exposeDir}`;
        continue;
      }

      if (/\.[jt]sx?$/.test(entry.name)) {
        const contents = fs.readFileSync(full, 'utf8');
        if (contents.includes(FEDERATED_EXPORT_COMMENT)) {
          const key = entry.name.replace(/\.[jt]sx?$/, '');
          exposes[`./${key}`] = `./src/${relFromSrc}`;
        }
      }
    }
  };

  walk(srcDir);
  return exposes;
};
