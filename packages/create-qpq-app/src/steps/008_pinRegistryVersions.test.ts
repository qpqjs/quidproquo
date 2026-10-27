import fs from 'fs';
import os from 'os';
import path from 'path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AppLanguage } from '../types';
import { pinRegistryVersions } from './008_pinRegistryVersions';

describe('pinRegistryVersions', () => {
  let targetDirectory: string;

  beforeEach(() => {
    targetDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'cqa-pin-'));
  });

  afterEach(() => {
    fs.rmSync(targetDirectory, { recursive: true, force: true });
  });

  it('pins the framework file: refs to its own version and leaves everything else alone', async () => {
    fs.writeFileSync(
      path.join(targetDirectory, 'package.json'),
      JSON.stringify({
        dependencies: {
          '@qpqjs/core': 'file:../packages/core',
          quidproquo: 'file:../packages/quidproquo',
          '@qpqjs/web-react': '0.0.1',
          '@other/lib': 'file:../other',
          react: '^19.0.0',
        },
        devDependencies: { '@qpqjs/cli': 'file:../packages/cli' },
      }),
    );

    await pinRegistryVersions.run({
      targetDirectory,
      templateDirectory: targetDirectory,
      ownVersion: '0.2.0',
      answers: {
        appName: 'myapp',
        language: AppLanguage.typescript,
        domain: 'example.com',
        dockerRegistry: '',
        dockerHost: '',
        initialiseGit: false,
        installDependencies: false,
      },
    });

    const packageJson = JSON.parse(fs.readFileSync(path.join(targetDirectory, 'package.json'), 'utf8'));
    expect(packageJson.dependencies).toEqual({
      '@qpqjs/core': '0.2.0',
      quidproquo: '0.2.0',
      '@qpqjs/web-react': '0.0.1',
      '@other/lib': 'file:../other',
      react: '^19.0.0',
    });
    expect(packageJson.devDependencies).toEqual({ '@qpqjs/cli': '0.2.0' });
  });
});
