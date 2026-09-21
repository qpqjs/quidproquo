import {
  buildTestQpqConfig,
  defineEventBus,
  defineKeyValueStore,
  defineQueue,
  EventBusActionType,
  KeyValueStoreActionType,
  LogActionType,
  noopDynamicModuleLoader,
  PlatformActionType,
  QueueActionType,
  resolveActionResult,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { getCoreActionProcessor } from './getCoreActionProcessor';

const { repo } = vi.hoisted(() => ({
  repo: { get: vi.fn(), delete: vi.fn(), query: vi.fn(), scan: vi.fn(), update: vi.fn(), upsert: vi.fn() },
}));

vi.mock('../../logic/keyValueStore/getKvsRepository', () => ({
  getKvsRepository: vi.fn(() => repo),
}));

const devServerConfig = {
  runtimePath: '/tmp/runtime',
  fileStorageConfig: {
    storagePath: '/tmp/files',
    secureUrlHost: 'localhost',
    secureUrlPort: 4000,
    secureUrlSecret: 'secret',
  },
} as any;

describe('getCoreActionProcessor', () => {
  it('aggregates processors across every core domain', async () => {
    const config = buildTestQpqConfig([defineKeyValueStore('store', 'id'), defineEventBus('myBus'), defineQueue('myQueue', {})]);

    const processors = await getCoreActionProcessor(config, noopDynamicModuleLoader, devServerConfig);

    expect(processors[KeyValueStoreActionType.Get]).toBeDefined();
    expect(processors[EventBusActionType.SendMessages]).toBeDefined();
    expect(processors[QueueActionType.SendMessages]).toBeDefined();
    expect(processors[LogActionType.Create]).toBeDefined();
    expect(processors[UserDirectoryActionType.DecodeAccessToken]).toBeDefined();
  });

  // The quidproquojs.com smoke suite compares askPlatformGetName against the
  // literal 'devServer' to skip deployed-only tests locally, so it is pinned here.
  it('answers askPlatformGetName with the name the smoke suite expects', async () => {
    const processors = await getCoreActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader, devServerConfig);
    const process = processors[PlatformActionType.GetName] as (payload: unknown) => Promise<any>;

    expect(resolveActionResult(await process({}))).toBe('devServer');
  });
});
