import { afterEach, describe, expect, it } from 'vitest';

import { getDeploySetting } from './getDeploySetting';
import { getDeploySettingEnvName } from './getDeploySettingEnvName';
import { getDeploySettingList } from './getDeploySettingList';
import { getDeploySettingOrDefault } from './getDeploySettingOrDefault';

const envName = getDeploySettingEnvName('PAGE_TITLE');

afterEach(() => {
  delete process.env[envName];
});

describe('getDeploySettingEnvName', () => {
  it('prefixes the key verbatim', () => {
    expect(envName).toBe('DEPLOY_SETTING_PAGE_TITLE');
  });
});

describe('getDeploySetting', () => {
  it('reads the primed value', () => {
    process.env[envName] = 'Other';
    expect(getDeploySetting('PAGE_TITLE')).toBe('Other');
  });

  it('keeps an empty string as a value', () => {
    process.env[envName] = '';
    expect(getDeploySetting('PAGE_TITLE')).toBe('');
  });

  it('throws naming the key when unset', () => {
    expect(() => getDeploySetting('PAGE_TITLE')).toThrow("Deploy setting 'PAGE_TITLE' is not defined");
  });
});

describe('getDeploySettingList', () => {
  it('splits on commas and trims', () => {
    process.env[envName] = 'example.com, example.org,,';
    expect(getDeploySettingList('PAGE_TITLE')).toEqual(['example.com', 'example.org']);
  });

  it('throws naming the key when unset', () => {
    expect(() => getDeploySettingList('PAGE_TITLE')).toThrow("Deploy setting 'PAGE_TITLE' is not defined");
  });
});

describe('getDeploySettingOrDefault', () => {
  it('falls back when unset', () => {
    expect(getDeploySettingOrDefault('PAGE_TITLE', 'Example')).toBe('Example');
  });

  it('prefers the primed value', () => {
    process.env[envName] = 'Other';
    expect(getDeploySettingOrDefault('PAGE_TITLE', 'Example')).toBe('Other');
  });
});
