import { DeployEventType, QPQCoreConfigSettingType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { defineMigration, getQpqMigrationQueueTypeFromQpqFunctionRuntime } from './migration';

describe('getQpqMigrationQueueTypeFromQpqFunctionRuntime', () => {
  it('strips leading slashes from a string runtime src path', () => {
    expect(getQpqMigrationQueueTypeFromQpqFunctionRuntime('/src/migrate::run')).toBe('src/migrate');
  });

  it('joins basePath and relativePath for an advanced runtime', () => {
    const runtime = { basePath: '/base', relativePath: '/nested/path', functionName: 'run' };

    expect(getQpqMigrationQueueTypeFromQpqFunctionRuntime(runtime)).toBe('/base/nested/path');
  });
});

describe('defineMigration', () => {
  it('emits a global, a tracking kvs, a deploy event and a queue', () => {
    const config = defineMigration([{ runtime: '/src/migrate::run', deployType: DeployEventType.Api }]);
    const types = config.map((setting) => (setting as { configSettingType: string }).configSettingType);

    expect(types).toEqual([
      QPQCoreConfigSettingType.global,
      QPQCoreConfigSettingType.keyValueStore,
      QPQCoreConfigSettingType.deployEvent,
      QPQCoreConfigSettingType.queue,
    ]);
  });
});
