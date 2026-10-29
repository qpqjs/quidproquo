import { getViewsEntryDistPath } from '@qpqjs/core';

import fs from 'fs';
import path from 'path';

import { ViewsEntry } from './ViewsEntry';

const DEFAULT_MAIN = `// Generated: this views package ships no entry of its own (see E8 in docs/code-standards.md).
import('./bootstrap');
`;

const DEFAULT_BOOTSTRAP = `// Generated: nothing mounts here. The package only exposes federated modules, which the shell
// loads through module federation; the async boundary above keeps share-scope init in order.
export {};
`;

const defaultHtml = (appName: string, serviceName: string): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${appName} ${serviceName}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <p>This views package exposes modules to the shell app and has no page of its own.</p>
  </body>
</html>
`;

/**
 * The entry a views package bundles from: its own src/main.ts (or main.js) and src/index.html
 * when it has them, else a generated default. A package whose modules are only loaded through
 * the shell keeps just modules/ and components/; the bundler supplies the rest (E8).
 */
export const resolveViewsEntry = (viewsDir: string, root: string, appName: string, serviceName: string): ViewsEntry => {
  const srcDir = path.join(viewsDir, 'src');
  const tsEntry = path.join(srcDir, 'main.ts');
  const jsEntry = path.join(srcDir, 'main.js');

  if (fs.existsSync(tsEntry) || fs.existsSync(jsEntry)) {
    return { entry: fs.existsSync(tsEntry) ? tsEntry : jsEntry, htmlTemplate: path.join(srcDir, 'index.html'), isDefault: false };
  }

  const entryDir = getViewsEntryDistPath(root, appName, serviceName);
  fs.mkdirSync(entryDir, { recursive: true });

  const entry = path.join(entryDir, 'main.ts');
  const htmlTemplate = path.join(entryDir, 'index.html');

  fs.writeFileSync(entry, DEFAULT_MAIN);
  fs.writeFileSync(path.join(entryDir, 'bootstrap.ts'), DEFAULT_BOOTSTRAP);
  fs.writeFileSync(htmlTemplate, defaultHtml(appName, serviceName));

  return { entry, htmlTemplate, isDefault: true };
};
