import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ScratchBuildRoot } from './ScratchBuildRoot';

/**
 * A scratch config root with one empty built handler folder per name under `build/` and an empty
 * extension layer folder, so a CDK synth in a unit test has directories for Code.fromAsset to
 * package without running a real build. `prefix` names the temp folder for anyone reading /tmp.
 */
export const createScratchBuildRoot = (handlerNames: string[], prefix = 'qpq-synth-'): ScratchBuildRoot => {
  const configRoot = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  for (const handlerName of handlerNames) {
    fs.mkdirSync(path.join(configRoot, 'build', handlerName), { recursive: true });
  }

  const extensionLayerPath = path.join(configRoot, 'extension-layer');
  fs.mkdirSync(extensionLayerPath);

  return { configRoot, extensionLayerPath, remove: () => fs.rmSync(configRoot, { recursive: true, force: true }) };
};
