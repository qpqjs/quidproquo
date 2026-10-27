import { defineAwsServiceAccountInfo } from 'quidproquo-config-aws';
import { buildTestQpqConfig } from 'quidproquo-core';
import { WebEntryActionType } from 'quidproquo-webserver';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';
import { invalidateCache } from '../../../logic/cloudFront/invalidateCache';
import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getWebEntryInvalidateCacheActionProcessor } from './getWebEntryInvalidateCacheActionProcessor';

vi.mock('../../../logic/cloudformation/getExportedValue', () => ({
  getExportedValue: vi.fn(),
}));
vi.mock('../../../logic/cloudFront/invalidateCache', () => ({
  invalidateCache: vi.fn(),
}));

const resolveProcessor = async () => {
  const config = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);
  const processors = await getWebEntryInvalidateCacheActionProcessor(config, {} as any);
  return processors[WebEntryActionType.InvalidateCache];
};

describe('getWebEntryInvalidateCacheActionProcessor', () => {
  beforeEach(() => {
    vi.mocked(getExportedValue).mockReset();
    vi.mocked(invalidateCache).mockReset();
  });

  it('invalidates the resolved distribution for the requested paths', async () => {
    vi.mocked(getExportedValue).mockResolvedValue('DIST123');
    const processor = await resolveProcessor();

    const result = await invokeProcessor(processor, { webEntryName: 'web', paths: ['/*'] });

    expect(result).toEqual([undefined]);
    expect(getExportedValue).toHaveBeenCalledWith('web-test-app-test-module-development-qpqdistribution-id-export', 'eu-west-1');
    expect(invalidateCache).toHaveBeenCalledWith('DIST123', 'eu-west-1', ['/*']);
  });
});
