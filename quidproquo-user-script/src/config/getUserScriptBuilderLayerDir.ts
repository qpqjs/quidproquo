import fs from 'fs';
import path from 'path';

import { USER_SCRIPT_BUILDER_LAYER_NAME } from './USER_SCRIPT_BUILDER_LAYER_NAME';

const PACKAGE_NAME = 'quidproquo-user-script';

// This package's root, from src under ts-node or from lib/commonjs, by walking up to its
// own package.json.
const getOwnPackageRoot = (): string => {
  let dir = __dirname;
  while (true) {
    const candidate = path.join(dir, 'package.json');
    if (fs.existsSync(candidate) && JSON.parse(fs.readFileSync(candidate, 'utf8')).name === PACKAGE_NAME) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`Could not locate the ${PACKAGE_NAME} package root from [${__dirname}]`);
    dir = parent;
  }
};

/**
 * The one directory the builder layer lives in: `<this package>/layer`. The api layer
 * entry reads it and `qpq script:builder-layer` writes it, so neither side is told a
 * path. Absolute, which is why the CDK resolves layer paths rather than joining them.
 */
export const getUserScriptBuilderLayerDir = (): string => path.join(getOwnPackageRoot(), 'layer', USER_SCRIPT_BUILDER_LAYER_NAME);
