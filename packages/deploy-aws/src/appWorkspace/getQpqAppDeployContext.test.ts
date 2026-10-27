import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, describe, expect, it } from 'vitest';

import { getQpqAppDeployContext } from './getQpqAppDeployContext';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-deploy-config-'));
const appDir = path.join(root, 'apps', 'example');
fs.mkdirSync(appDir, { recursive: true });
fs.writeFileSync(
  path.join(appDir, 'deploy.config.json'),
  JSON.stringify({
    deployments: {
      'example-dev': {
        platform: 'aws',
        name: 'example',
        environment: 'development',
        platformSettings: { accountId: '123456789012', region: 'ap-southeast-2' },
        settings: { PAGE_TITLE: 'Example' },
      },
      local: { platform: 'docker', name: 'example', environment: 'local' },
    },
  }),
);

afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe('getQpqAppDeployContext', () => {
  it('builds the fragment context from an aws deployment', () => {
    expect(getQpqAppDeployContext(root, 'example', 'example-dev')).toEqual({
      appName: 'example',
      appDir,
      deploymentName: 'example-dev',
      name: 'example',
      environment: 'development',
      feature: undefined,
      settings: { PAGE_TITLE: 'Example' },
      accountId: '123456789012',
      region: 'ap-southeast-2',
    });
  });

  it('refuses a docker deployment, which never reaches the CDK app', () => {
    expect(() => getQpqAppDeployContext(root, 'example', 'local')).toThrow("targets 'docker', not aws");
  });

  it('throws listing the configured names for an unknown deployment', () => {
    expect(() => getQpqAppDeployContext(root, 'example', 'prod')).toThrow('Configured: example-dev, local');
  });
});
