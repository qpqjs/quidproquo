import { QpqAppDeployment, QpqDeployEnvVar } from 'quidproquo-core';

import { afterEach, describe, expect, it } from 'vitest';

import { primeDeploymentEnv } from './primeDeploymentEnv';

const primed = [...Object.values(QpqDeployEnvVar), 'DEPLOY_SETTING_PAGE_TITLE', 'AWS_DEFAULT_ACCOUNT'];

afterEach(() => {
  for (const name of primed) delete process.env[name];
});

const awsDeployment: QpqAppDeployment = {
  platform: 'aws',
  name: 'example',
  environment: 'production',
  feature: 'sample',
  settings: { PAGE_TITLE: 'Example' },
  platformSettings: { accountId: '123456789012', region: 'ap-southeast-2' },
};

describe('primeDeploymentEnv', () => {
  it('writes every part of an aws deployment into the environment', () => {
    primeDeploymentEnv('example', 'feature-prod', awsDeployment);

    expect(process.env.DEPLOY_APP_NAME).toBe('example');
    expect(process.env.DEPLOY_NAME).toBe('feature-prod');
    expect(process.env.APPLICATION_NAME).toBe('example');
    expect(process.env.ENVIRONMENT).toBe('production');
    expect(process.env.FEATURE_NAME).toBe('sample');
    expect(process.env.DEPLOY_SETTING_PAGE_TITLE).toBe('Example');
  });

  it('leaves platform identity to the platform primer', () => {
    primeDeploymentEnv('example', 'feature-prod', awsDeployment);

    expect(process.env.AWS_DEFAULT_ACCOUNT).toBeUndefined();
  });

  it('overwrites values already in the shell, the file is the source of truth', () => {
    process.env.ENVIRONMENT = 'development';
    process.env.APPLICATION_NAME = 'other';

    primeDeploymentEnv('example', 'feature-prod', awsDeployment);

    expect(process.env.ENVIRONMENT).toBe('production');
    expect(process.env.APPLICATION_NAME).toBe('example');
  });

  it('clears a stale feature when the deployment has none', () => {
    process.env.FEATURE_NAME = 'someone-else';

    primeDeploymentEnv('example', 'local', { platform: 'docker', name: 'example', environment: 'local' });

    expect(process.env.FEATURE_NAME).toBeUndefined();
  });
});
