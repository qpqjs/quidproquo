import { afterEach, describe, expect, it } from 'vitest';

import { primeAwsDeploymentEnv } from './primeAwsDeploymentEnv';
import { validateAwsDeployment } from './validateAwsDeployment';

afterEach(() => {
  delete process.env.AWS_DEFAULT_ACCOUNT;
  delete process.env.AWS_DEFAULT_REGION;
});

const base = { name: 'example', environment: 'development' };

describe('validateAwsDeployment', () => {
  it('narrows a complete aws deployment', () => {
    const deployment = validateAwsDeployment('example-dev', {
      ...base,
      platform: 'aws',
      platformSettings: { accountId: '123456789012', region: 'ap-southeast-2' },
    });

    expect(deployment.platformSettings.region).toBe('ap-southeast-2');
  });

  it('refuses another platform', () => {
    expect(() => validateAwsDeployment('local', { ...base, platform: 'docker' })).toThrow("targets 'docker', not aws");
  });

  it('lists every missing identity field', () => {
    const attempt = () => validateAwsDeployment('example-dev', { ...base, platform: 'aws', platformSettings: { region: '' } });

    expect(attempt).toThrow("Invalid aws deployment 'example-dev'");
    expect(attempt).toThrow('"platformSettings.accountId" must be a non-empty string');
    expect(attempt).toThrow('"platformSettings.region" must be a non-empty string');
  });

  it('handles missing platform settings', () => {
    expect(() => validateAwsDeployment('example-dev', { ...base, platform: 'aws' })).toThrow('"platformSettings.accountId"');
  });
});

describe('primeAwsDeploymentEnv', () => {
  it('overwrites the identity vars from the deployment', () => {
    process.env.AWS_DEFAULT_ACCOUNT = '999999999999';

    primeAwsDeploymentEnv({ ...base, platform: 'aws', platformSettings: { accountId: '123456789012', region: 'ap-southeast-2' } });

    expect(process.env.AWS_DEFAULT_ACCOUNT).toBe('123456789012');
    expect(process.env.AWS_DEFAULT_REGION).toBe('ap-southeast-2');
  });
});
