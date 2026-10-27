/**
 * Bundles the qpq-log-extension into a Lambda layer directory.
 *
 * Layer layout (unpacked into /opt at runtime):
 *   extensions/qpq-log-extension      <- executable wrapper Lambda runs at init
 *   qpq-log-extension/index.js        <- esbuild bundle (all deps inlined)
 *
 * Output dir is exported from the package via getLogExtensionLayerPath().
 */
import { build } from 'esbuild';
import { chmodSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgRoot = join(__dirname, '..');

// Output under lib/ so it ships with the package (files: ["lib/**/*"]).
const layerDir = join(pkgRoot, 'lib', 'extension-layer');
const extensionsDir = join(layerDir, 'extensions');
const bundleDir = join(layerDir, 'qpq-log-extension');

mkdirSync(extensionsDir, { recursive: true });
mkdirSync(bundleDir, { recursive: true });

// Bundle the extension (inline @aws-sdk/client-s3 so it resolves in the
// separate extension process regardless of NODE_PATH).
await build({
  entryPoints: [join(pkgRoot, 'src/lambdaExtensions/qpqLogExtension/index.ts')],
  outfile: join(bundleDir, 'index.js'),
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'cjs',
  minify: true,
});

// Executable wrapper. Its filename MUST match EXTENSION_NAME / the
// Lambda-Extension-Name header used during register.
const wrapperPath = join(extensionsDir, 'qpq-log-extension');
writeFileSync(wrapperPath, '#!/bin/bash\nexec /usr/bin/env node /opt/qpq-log-extension/index.js\n');
chmodSync(wrapperPath, 0o755);

console.log(`qpq-log-extension layer built at ${layerDir}`);
