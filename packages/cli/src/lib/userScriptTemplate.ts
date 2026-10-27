import fs from 'fs';
import path from 'path';

import { getOwnPackageRoot } from './packageRoot';

const TEMPLATE_DIR = 'templates/user-script';

// Shipped as `gitignore` because npm drops `.gitignore` files from a published package.
const RENAMED_ON_COPY: Record<string, string> = { gitignore: '.gitignore' };

const TEXT_SUBSTITUTIONS = ['package.json', 'README.md'];

const readOwnVersion = (): string => JSON.parse(fs.readFileSync(path.join(getOwnPackageRoot(), 'package.json'), 'utf8')).version as string;

const listFilesRecursive = (dir: string, base: string = dir): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? listFilesRecursive(fullPath, base) : [path.relative(base, fullPath)];
  });

const substitute = (text: string, packageName: string, qpqVersion: string): string =>
  text.replace(/__PACKAGE_NAME__/g, packageName).replace(/__QPQ_VERSION__/g, qpqVersion);

/**
 * Writes the user-script template project into `targetDir`, naming the package after
 * the directory and pinning @qpqjs/core to this CLI's own version. Refuses a
 * directory that already has files in it. Returns the relative paths written.
 */
export const createUserScriptProject = (targetDir: string): string[] => {
  const absoluteTarget = path.resolve(targetDir);
  if (fs.existsSync(absoluteTarget) && fs.readdirSync(absoluteTarget).length > 0) {
    throw new Error(`[${absoluteTarget}] is not empty; script:new only writes into a new or empty directory`);
  }

  const templateRoot = path.join(getOwnPackageRoot(), TEMPLATE_DIR);
  const packageName = path.basename(absoluteTarget);
  const qpqVersion = readOwnVersion();

  const written: string[] = [];
  for (const relativePath of listFilesRecursive(templateRoot)) {
    const basename = path.basename(relativePath);
    const outputRelative = path.join(path.dirname(relativePath), RENAMED_ON_COPY[basename] ?? basename);
    const outputPath = path.join(absoluteTarget, outputRelative);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    const source = fs.readFileSync(path.join(templateRoot, relativePath), 'utf8');
    fs.writeFileSync(outputPath, TEXT_SUBSTITUTIONS.includes(basename) ? substitute(source, packageName, qpqVersion) : source);
    written.push(outputRelative);
  }

  return written.sort();
};
