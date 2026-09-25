import { describe, expect, it } from 'vitest';

import { validateQpqAppDeployConfig } from './validateQpqAppDeployConfig';

const configPath = 'apps/example/deploy.config.json';

const awsDeployment = {
  platform: 'aws',
  name: 'example',
  environment: 'development',
  platformSettings: { accountId: '123456789012', region: 'ap-southeast-2' },
};

const validate = (raw: unknown) => validateQpqAppDeployConfig(raw, configPath);

describe('validateQpqAppDeployConfig', () => {
  it('accepts an aws deployment with settings and a feature', () => {
    const config = validate({
      deployments: { 'feature-dev': { ...awsDeployment, feature: 'sample', settings: { PAGE_TITLE: 'Example', MAX_ITEMS: '10' } } },
    });

    expect(config.deployments['feature-dev'].platform).toBe('aws');
    expect(config.deployments['feature-dev'].settings).toEqual({ PAGE_TITLE: 'Example', MAX_ITEMS: '10' });
  });

  it('accepts a docker deployment with no platform settings', () => {
    const config = validate({ deployments: { local: { platform: 'docker', name: 'example', environment: 'local' } } });

    expect(config.deployments.local.platform).toBe('docker');
  });

  it('rejects a file without a deployments map', () => {
    expect(() => validate({ prefix: 'example', environments: {} })).toThrow('must be { "deployments"');
  });

  it('rejects an empty deployments map', () => {
    expect(() => validate({ deployments: {} })).toThrow('at least one entry');
  });

  it('reports every problem in one error', () => {
    const attempt = () => validate({ deployments: { prod: { platform: '', settings: { pageTitle: true } } } });

    expect(attempt).toThrow(`Invalid ${configPath}:`);
    expect(attempt).toThrow('"name" must be a non-empty string');
    expect(attempt).toThrow('"environment" must be a non-empty string');
    expect(attempt).toThrow('"platform" must be a non-empty string');
    expect(attempt).toThrow('setting "pageTitle" must be UPPER_SNAKE_CASE');
    expect(attempt).toThrow('"settings.pageTitle" must be a string');
  });

  it('leaves which platform settings are required to the platform', () => {
    expect(() => validate({ deployments: { prod: { ...awsDeployment, platformSettings: undefined } } })).not.toThrow();
  });

  it('requires platform settings to be a flat string map', () => {
    expect(() => validate({ deployments: { prod: { ...awsDeployment, platformSettings: { accountId: 123 } } } })).toThrow(
      '"platformSettings.accountId" must be a string',
    );
    expect(() => validate({ deployments: { prod: { ...awsDeployment, platformSettings: 'x' } } })).toThrow(
      '"platformSettings" must be an object of string values',
    );
  });

  it('rejects a non-string setting value so booleans never stringify silently', () => {
    expect(() => validate({ deployments: { prod: { ...awsDeployment, settings: { ENABLED: true } } } })).toThrow(
      '"settings.ENABLED" must be a string',
    );
  });

  it('rejects an empty feature', () => {
    expect(() => validate({ deployments: { prod: { ...awsDeployment, feature: '' } } })).toThrow('"feature" must be a non-empty string when set');
  });
});
