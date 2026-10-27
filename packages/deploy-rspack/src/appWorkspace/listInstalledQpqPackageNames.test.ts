import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { listInstalledQpqPackageNames } from './listInstalledQpqPackageNames';

describe('listInstalledQpqPackageNames', () => {
  let nodeModules: string;

  beforeEach(() => {
    nodeModules = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-installed-packages-'));
  });

  afterEach(() => {
    fs.rmSync(nodeModules, { recursive: true, force: true });
  });

  it('lists the umbrella and every package under the @qpqjs scope, and nothing else', () => {
    for (const dir of ['quidproquo', '@qpqjs/core', '@qpqjs/webserver', '@qpqjs/.cache', '@other/core', 'react', 'quidproquo-core']) {
      fs.mkdirSync(path.join(nodeModules, dir), { recursive: true });
    }

    expect(listInstalledQpqPackageNames(nodeModules)).toEqual(['quidproquo', '@qpqjs/core', '@qpqjs/webserver']);
  });

  it('is empty when nothing is installed', () => {
    expect(listInstalledQpqPackageNames(path.join(nodeModules, 'missing'))).toEqual([]);
  });
});
