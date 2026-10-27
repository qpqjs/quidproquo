import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterAll, afterEach, describe, expect, it } from 'vitest';

import { getAwsServiceAccountInfosForDeployments } from './getAwsServiceAccountInfosForDeployments';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-cross-deploy-'));
const appDir = path.join(root, 'apps', 'example');
fs.mkdirSync(appDir, { recursive: true });
fs.writeFileSync(
  path.join(appDir, 'deploy.config.json'),
  JSON.stringify({
    deployments: {
      production: {
        platform: 'aws',
        name: 'example',
        environment: 'production',
        platformSettings: { accountId: '111111111111', region: 'ap-southeast-2' },
      },
      staging: { platform: 'aws', name: 'example', environment: 'staging', platformSettings: { accountId: '111111111111', region: 'us-east-1' } },
      'feature-dev': {
        platform: 'aws',
        name: 'example',
        environment: 'development',
        feature: 'sample',
        platformSettings: { accountId: '222222222222', region: 'ap-southeast-2' },
      },
      local: { platform: 'docker', name: 'example', environment: 'local' },
    },
  }),
);

afterEach(() => {
  delete process.env.DEPLOY_APP_NAME;
});
afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

describe('getAwsServiceAccountInfosForDeployments', () => {
  it('emits one row per module per deployment with that deployment’s own identity', () => {
    const rows = getAwsServiceAccountInfosForDeployments(['production', 'staging', 'feature-dev'], ['auth', 'admin'], { root, appName: 'example' });

    expect(rows).toEqual([
      { moduleName: 'auth', environment: 'production', feature: undefined, awsAccountId: '111111111111', awsRegion: 'ap-southeast-2' },
      { moduleName: 'admin', environment: 'production', feature: undefined, awsAccountId: '111111111111', awsRegion: 'ap-southeast-2' },
      { moduleName: 'auth', environment: 'staging', feature: undefined, awsAccountId: '111111111111', awsRegion: 'us-east-1' },
      { moduleName: 'admin', environment: 'staging', feature: undefined, awsAccountId: '111111111111', awsRegion: 'us-east-1' },
      { moduleName: 'auth', environment: 'development', feature: 'sample', awsAccountId: '222222222222', awsRegion: 'ap-southeast-2' },
      { moduleName: 'admin', environment: 'development', feature: 'sample', awsAccountId: '222222222222', awsRegion: 'ap-southeast-2' },
    ]);
  });

  it('defaults the app to the primed DEPLOY_APP_NAME', () => {
    process.env.DEPLOY_APP_NAME = 'example';

    expect(getAwsServiceAccountInfosForDeployments(['production'], ['auth'], { root })).toHaveLength(1);
  });

  it('throws without an app to read', () => {
    expect(() => getAwsServiceAccountInfosForDeployments(['production'], ['auth'], { root })).toThrow('No app to read deployments for');
  });

  it('throws for an unknown or non-aws deployment', () => {
    expect(() => getAwsServiceAccountInfosForDeployments(['nope'], ['auth'], { root, appName: 'example' })).toThrow("No deployment 'nope'");
    expect(() => getAwsServiceAccountInfosForDeployments(['local'], ['auth'], { root, appName: 'example' })).toThrow("targets 'docker', not aws");
  });
});
