import { DeployEventType, QPQCoreConfigSettingType, QueueQPQConfigSetting } from '@qpqjs/core';

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

  it('gives a migration one try, so one that failed part way is never run again by itself', () => {
    const queue = defineMigration([{ runtime: '/src/migrate::run', deployType: DeployEventType.Api }]).find(
      (setting) => (setting as QueueQPQConfigSetting).configSettingType === QPQCoreConfigSettingType.queue,
    ) as QueueQPQConfigSetting;

    expect(queue.maxTries).toBe(1);
  });
});
