import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig } from 'quidproquo-core';
import { ApiKeyValidationActionType } from 'quidproquo-webserver';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getApiKeyValue } from '../../../logic/apiGateway/getApiKeyValue';
import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getApiKeyValidationValidateActionProcessor } from './getApiKeyValidationValidateActionProcessor';

vi.mock('../../../logic/apiGateway/getApiKeyValue', () => ({
  getApiKeyValue: vi.fn(),
}));

vi.mock('../../../logic/cloudformation/getExportedValue', () => ({
  getExportedValue: vi.fn(),
}));

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);
  const processors = await getApiKeyValidationValidateActionProcessor(config, {} as any);
  return processors[ApiKeyValidationActionType.Validate];
};

const invoke = (processor: any, apiKeyValue: string, apiKeyReferences: any[] = [{ name: 'key' }]) =>
  invokeProcessor(processor, { apiKeyValue, apiKeyReferences });

describe('getApiKeyValidationValidateActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getApiKeyValue).mockReset();
    vi.mocked(getExportedValue).mockReset();
  });

  it('resolves each api key reference via its CFN export and fetches that key by id', async () => {
    vi.mocked(getExportedValue).mockResolvedValue('key-id-123');
    vi.mocked(getApiKeyValue).mockResolvedValue('secret');
    const processor = await resolveProcessor();

    await invoke(processor, 'anything');

    expect(getExportedValue).toHaveBeenCalledWith('key-test-app-test-module-development-qpqapi-key-id-export', 'eu-west-1');
    expect(getApiKeyValue).toHaveBeenCalledWith('eu-west-1', 'key-id-123');
  });

  it('honours cross-service references when building the export name', async () => {
    vi.mocked(getExportedValue).mockResolvedValue('key-id-123');
    vi.mocked(getApiKeyValue).mockResolvedValue('secret');
    const processor = await resolveProcessor();

    await invoke(processor, 'anything', [{ name: 'key', serviceName: 'other-module' }]);

    expect(getExportedValue).toHaveBeenCalledWith('key-test-app-other-module-development-qpqapi-key-id-export', 'eu-west-1');
  });

  it('returns true when a configured key matches the provided value', async () => {
    vi.mocked(getExportedValue).mockResolvedValue('key-id-123');
    vi.mocked(getApiKeyValue).mockResolvedValue('secret');
    const processor = await resolveProcessor();

    expect(await invoke(processor, 'secret')).toEqual([true]);
  });

  it('returns false when no configured key matches', async () => {
    vi.mocked(getExportedValue).mockResolvedValue('key-id-123');
    vi.mocked(getApiKeyValue).mockResolvedValue('secret');
    const processor = await resolveProcessor();

    expect(await invoke(processor, 'wrongg')).toEqual([false]);
  });

  it('returns false when the provided value differs in length', async () => {
    vi.mocked(getExportedValue).mockResolvedValue('key-id-123');
    vi.mocked(getApiKeyValue).mockResolvedValue('secret');
    const processor = await resolveProcessor();

    expect(await invoke(processor, 'short')).toEqual([false]);
  });

  it('treats an unresolvable key reference as no match rather than an error', async () => {
    vi.mocked(getExportedValue).mockRejectedValue(new Error('CF could not find: [missing]'));
    const processor = await resolveProcessor();

    expect(await invoke(processor, 'secret')).toEqual([false]);
    expect(getApiKeyValue).not.toHaveBeenCalled();
  });
});
