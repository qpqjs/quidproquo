import { buildTestQpqConfig, defineParameter, defineSecret } from 'quidproquo-core';

import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getOrSeedParameterValue, getOrSeedSecretValue, setParameterValue } from './jsonConfigFileStore';

const readStoreFile = async (runtimePath: string, storeDirectory: string, serviceName: string): Promise<Record<string, string>> =>
  JSON.parse(await fs.readFile(path.join(runtimePath, storeDirectory, `${serviceName}.json`), 'utf8'));

describe('jsonConfigFileStore', () => {
  let runtimePath: string;

  beforeEach(async () => {
    runtimePath = await fs.mkdtemp(path.join(os.tmpdir(), 'qpq-config-store-'));
  });

  afterEach(async () => {
    await fs.rm(runtimePath, { recursive: true, force: true });
  });

  describe('getOrSeedParameterValue', () => {
    it('seeds the config default into the service file on first read', async () => {
      const qpqConfig = buildTestQpqConfig([defineParameter('adminEmail', { value: 'joe@example.com' })]);

      const value = await getOrSeedParameterValue(runtimePath, 'adminEmail', qpqConfig);

      expect(value).toBe('joe@example.com');
      expect(await readStoreFile(runtimePath, 'parameters', 'test-module')).toEqual({ adminEmail: 'joe@example.com' });
    });

    it('returns the persisted value over the config default', async () => {
      const qpqConfig = buildTestQpqConfig([defineParameter('adminEmail', { value: 'joe@example.com' })]);

      await fs.mkdir(path.join(runtimePath, 'parameters'), { recursive: true });
      await fs.writeFile(path.join(runtimePath, 'parameters', 'test-module.json'), JSON.stringify({ adminEmail: 'edited@example.com' }));

      expect(await getOrSeedParameterValue(runtimePath, 'adminEmail', qpqConfig)).toBe('edited@example.com');
    });

    it('resolves a cross-module owner to the owning service file and key', async () => {
      const qpqConfig = buildTestQpqConfig([defineParameter('adminEmail', { owner: { module: 'auth', parameterName: 'ownerEmail' } })]);

      await getOrSeedParameterValue(runtimePath, 'adminEmail', qpqConfig);

      expect(await readStoreFile(runtimePath, 'parameters', 'auth')).toEqual({ ownerEmail: '' });
    });

    it('throws for a parameter that is not defined in the config', async () => {
      await expect(getOrSeedParameterValue(runtimePath, 'unknown', buildTestQpqConfig())).rejects.toThrow('Parameter unknown not found');
    });
  });

  describe('setParameterValue', () => {
    it('writes the value and preserves other keys in the file', async () => {
      const qpqConfig = buildTestQpqConfig([defineParameter('adminEmail', { value: 'joe@example.com' }), defineParameter('theme')]);

      await getOrSeedParameterValue(runtimePath, 'adminEmail', qpqConfig);
      await setParameterValue(runtimePath, 'theme', qpqConfig, 'dark');

      expect(await readStoreFile(runtimePath, 'parameters', 'test-module')).toEqual({ adminEmail: 'joe@example.com', theme: 'dark' });
    });

    it('throws for a parameter that is not defined in the config', async () => {
      await expect(setParameterValue(runtimePath, 'unknown', buildTestQpqConfig(), 'x')).rejects.toThrow('Parameter unknown not found');
    });
  });

  describe('getOrSeedSecretValue', () => {
    it('generates a guid on first read and returns the same value after', async () => {
      const qpqConfig = buildTestQpqConfig([defineSecret('apiKey')]);

      const first = await getOrSeedSecretValue(runtimePath, 'apiKey', qpqConfig);
      const second = await getOrSeedSecretValue(runtimePath, 'apiKey', qpqConfig);

      expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(second).toBe(first);
      expect(await readStoreFile(runtimePath, 'secrets', 'test-module')).toEqual({ apiKey: first });
    });

    it('resolves a cross-module owner to the owning service file', async () => {
      const qpqConfig = buildTestQpqConfig([defineSecret('apiKey', { owner: { module: 'auth' } })]);

      const value = await getOrSeedSecretValue(runtimePath, 'apiKey', qpqConfig);

      expect(await readStoreFile(runtimePath, 'secrets', 'auth')).toEqual({ apiKey: value });
    });

    it('throws for a secret that is not defined in the config', async () => {
      await expect(getOrSeedSecretValue(runtimePath, 'unknown', buildTestQpqConfig())).rejects.toThrow('Can not find secret [unknown]');
    });
  });
});
