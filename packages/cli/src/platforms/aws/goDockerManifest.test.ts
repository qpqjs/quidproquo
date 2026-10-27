import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, expect, it, vi } from 'vitest';

import {
  fromManifestPath,
  getGoDockerAssemblyDir,
  getGoDockerBuildDir,
  GoDockerBuildManifest,
  readGoDockerBuildManifest,
  toManifestPath,
  writeGoDockerBuildManifest,
} from './goDockerManifest';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-cli-go-docker-'));

vi.mock('../../lib/discovery', () => ({ getRoot: () => root }));

const manifest: GoDockerBuildManifest = {
  cdkVersion: '2.1132.1',
  deploymentName: 'development',
  builtFor: 'all',
  stacks: { inf: 'qpqjs-dev-shell-inf', api: 'qpqjs-dev-shell-api', web: 'qpqjs-dev-shell-web' },
  views: { dir: 'dist/apps/qpqjs/services/shell/views', destinations: ['s3://views-bucket/shell', 's3://website-bucket'] },
  remote: {
    dir: 'dist/apps/qpqjs/services/shell/service-remote-published',
    manifestHash: 'abc123',
    bucketName: 'code-bucket',
    servicePrefix: 'shell',
  },
};

describe('go:docker build manifest', () => {
  it('round-trips through the service build dir', () => {
    writeGoDockerBuildManifest('qpqjs', 'shell', manifest);

    expect(readGoDockerBuildManifest('qpqjs', 'shell')).toEqual(manifest);
    expect(fs.existsSync(path.join(getGoDockerBuildDir('qpqjs', 'shell'), 'deploy.json'))).toBe(true);
  });

  it('keeps the assembly beside the manifest', () => {
    expect(getGoDockerAssemblyDir('qpqjs', 'shell')).toBe(path.join(root, 'dist', 'qpq', 'go-docker', 'qpqjs', 'shell', 'assembly'));
  });

  it('names the missing directory and the command that fills it', () => {
    expect(() => readGoDockerBuildManifest('qpqjs', 'admin')).toThrow(path.join(root, 'dist', 'qpq', 'go-docker', 'qpqjs', 'admin'));
    expect(() => readGoDockerBuildManifest('qpqjs', 'admin')).toThrow('--build-only');
  });

  it('stores paths relative to the root and resolves them back', () => {
    const viewsDir = path.join(root, 'dist', 'apps', 'qpqjs', 'services', 'shell', 'views');

    expect(toManifestPath(viewsDir)).toBe('dist/apps/qpqjs/services/shell/views');
    expect(fromManifestPath('dist/apps/qpqjs/services/shell/views')).toBe(viewsDir);
  });
});
