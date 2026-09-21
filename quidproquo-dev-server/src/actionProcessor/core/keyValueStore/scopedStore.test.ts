import {
  askKeyValueStoreGetAllBase,
  askKeyValueStoreGetBase,
  askKeyValueStoreScanBase,
  buildTestQpqConfig,
  defineKeyValueStore,
  KeyValueStoreActionType,
  noopDynamicModuleLoader,
  resolveActionResultError,
} from 'quidproquo-core';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/testProcessorRuntime';
import { getKeyValueStoreGetActionProcessor } from './getKeyValueStoreGetActionProcessor';
import { getKeyValueStoreGetAllActionProcessor } from './getKeyValueStoreGetAllActionProcessor';
import { getKeyValueStoreScanActionProcessor } from './getKeyValueStoreScanActionProcessor';

const { repo } = vi.hoisted(() => ({
  repo: { get: vi.fn(), getAll: vi.fn(), delete: vi.fn(), query: vi.fn(), scan: vi.fn(), update: vi.fn(), upsert: vi.fn() },
}));

vi.mock('../../../logic/keyValueStore/getKvsRepository', () => ({
  getKvsRepository: vi.fn(() => repo),
}));

const devServerConfig = { runtimePath: '/tmp/runtime' } as any;
const qpqConfig = buildTestQpqConfig([defineKeyValueStore('tenantStore', { key: 'id', type: 'string' }, [], { scoped: true })]);

// The processors that branch on scope before validating are the ones that
// could let an unscoped call through, so they are the ones pinned here.
describe('scoped key value store on the dev server', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refuses an unscoped get', async () => {
    const process = (await getKeyValueStoreGetActionProcessor(devServerConfig)(qpqConfig, noopDynamicModuleLoader))[KeyValueStoreActionType.Get];

    const result = await invokeProcessor(process, { keyValueStoreName: 'tenantStore', key: { id: 'a' } });

    expect(resolveActionResultError(result).errorType).toBe(askKeyValueStoreGetBase.errorType.InvalidScope);
    expect(repo.get).not.toHaveBeenCalled();
  });

  it('refuses an unscoped get-all', async () => {
    const process = (await getKeyValueStoreGetAllActionProcessor(devServerConfig)(qpqConfig, noopDynamicModuleLoader))[
      KeyValueStoreActionType.GetAll
    ];

    const result = await invokeProcessor(process, { keyValueStoreName: 'tenantStore' });

    expect(resolveActionResultError(result).errorType).toBe(askKeyValueStoreGetAllBase.errorType.InvalidScope);
    expect(repo.getAll).not.toHaveBeenCalled();
  });

  it('refuses an unscoped scan', async () => {
    const process = (await getKeyValueStoreScanActionProcessor(devServerConfig)(qpqConfig, noopDynamicModuleLoader))[KeyValueStoreActionType.Scan];

    const result = await invokeProcessor(process, { keyValueStoreName: 'tenantStore' });

    expect(resolveActionResultError(result).errorType).toBe(askKeyValueStoreScanBase.errorType.InvalidScope);
    expect(repo.scan).not.toHaveBeenCalled();
  });

  it('serves a scoped get-all', async () => {
    repo.getAll.mockResolvedValue([]);
    const process = (await getKeyValueStoreGetAllActionProcessor(devServerConfig)(qpqConfig, noopDynamicModuleLoader))[
      KeyValueStoreActionType.GetAll
    ];

    await invokeProcessor(process, { keyValueStoreName: 'tenantStore', options: { scope: 'TENANT#a' } });

    expect(repo.getAll).toHaveBeenCalledWith('tenantStore', 'TENANT#a');
  });
});
