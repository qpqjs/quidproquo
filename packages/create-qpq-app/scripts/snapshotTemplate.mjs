// Snapshot the repo's quidproquojs.com into template/, the living template that
// create-qpq-app ships in its tarball. Runs on prepack so every publish
// captures the repo as it is that release; the scaffolding steps do all
// pruning/renaming at generate time.
//
// Two transforms happen here rather than at scaffold time because they're
// npm-packaging concerns, not app-shaping concerns:
//   - build artifacts / local state are excluded
//   - .gitignore files are stored dotless (npm strips dotted ones from
//     tarballs); the restoreGitignore step puts the dots back
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.resolve(packageRoot, '..', '..', 'quidproquojs.com');
const templateDir = path.join(packageRoot, 'template');

const EXCLUDED_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  '.git',
  '.turbo',
  '.docusaurus',
  'cdk.out',
  '.qpq-runtime',
  '@mf-types',
  '.pnotes',
  'coverage',
  'tmp',
]);

// Relative paths (from the repo root) excluded specifically: build output
// dirs whose names are too generic to exclude globally.
const EXCLUDED_RELATIVE_PATHS = new Set(['docusaurus/build']);

const EXCLUDED_FILE_NAMES = new Set(['package-lock.json', 'cdk.context.json', '.DS_Store']);
const EXCLUDED_FILE_SUFFIXES = ['.log', '.tsbuildinfo', '.tgz'];
const EXCLUDED_FILE_PREFIXES = ['.env'];

let fileCount = 0;
let byteCount = 0;

const copyTree = (fromDir, toDir, relativeDir) => {
  fs.mkdirSync(toDir, { recursive: true });

  for (const entry of fs.readdirSync(fromDir, { withFileTypes: true })) {
    const relativePath = relativeDir ? `${relativeDir}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      if (EXCLUDED_DIR_NAMES.has(entry.name) || EXCLUDED_RELATIVE_PATHS.has(relativePath)) continue;
      copyTree(path.join(fromDir, entry.name), path.join(toDir, entry.name), relativePath);
      continue;
    }

    if (EXCLUDED_FILE_NAMES.has(entry.name)) continue;
    if (EXCLUDED_FILE_SUFFIXES.some((suffix) => entry.name.endsWith(suffix))) continue;
    if (EXCLUDED_FILE_PREFIXES.some((prefix) => entry.name.startsWith(prefix))) continue;

    const targetName = entry.name === '.gitignore' ? 'gitignore' : entry.name;
    const targetPath = path.join(toDir, targetName);
    fs.copyFileSync(path.join(fromDir, entry.name), targetPath);

    fileCount += 1;
    byteCount += fs.statSync(targetPath).size;
  }
};

if (!fs.existsSync(sourceDir)) {
  console.error(`snapshot-template: source not found at ${sourceDir}. Run from the quidproquo monorepo checkout.`);
  process.exit(1);
}

fs.rmSync(templateDir, { recursive: true, force: true });
copyTree(sourceDir, templateDir, '');

console.log(`snapshot-template: ${fileCount} files (${(byteCount / 1024 / 1024).toFixed(1)} MiB) -> template/`);
