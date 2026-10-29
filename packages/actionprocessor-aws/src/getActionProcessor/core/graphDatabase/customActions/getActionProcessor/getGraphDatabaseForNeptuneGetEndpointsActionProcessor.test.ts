import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { ErrorTypeEnum } from '@qpqjs/core';
import { buildTestQpqConfig, invokeProcessor } from '@qpqjs/testing';

import { describe, expect, it, vi } from 'vitest';

import { getConfigRuntimeResourceNameFromConfig } from '../../../../../awsNamingUtils';
import { getNeptuneEndpoints } from '../../../../../logic/neptune';
import { GraphDatabaseForNeptuneActionType } from '../actions';
import { getGraphDatabaseForNeptuneGetEndpointsActionProcessor } from './getGraphDatabaseForNeptuneGetEndpointsActionProcessor';

vi.mock('../../../../../awsNamingUtils', () => ({
  getConfigRuntimeResourceNameFromConfig: vi.fn(() => 'graph-db-name'),
}));
vi.mock('../../../../../logic/neptune', () => ({ getNeptuneEndpoints: vi.fn() }));

const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('123456789012', 'us-test-1')]);

const invoke = async (payload: { graphDatabaseName: string }) => {
  const processor = (await getGraphDatabaseForNeptuneGetEndpointsActionProcessor(qpqConfig, null as any))[
    GraphDatabaseForNeptuneActionType.GetEndpoints
  ];
  return invokeProcessor(processor, payload);
};

describe('getProcessGetEndpoints', () => {
  it('resolves neptune endpoints for the derived database name', async () => {
    const endpoints = { readEndpoint: 'http://read', writeEndpoint: 'http://write' };
    vi.mocked(getNeptuneEndpoints).mockResolvedValue(endpoints);

    const [result] = await invoke({ graphDatabaseName: 'graph' });

    expect(result).toBe(endpoints);
    expect(getConfigRuntimeResourceNameFromConfig).toHaveBeenCalledWith('graph', qpqConfig);
    expect(getNeptuneEndpoints).toHaveBeenCalledWith('graph-db-name', 'us-test-1');
  });

  it('maps a thrown error via the caught-error mapper', async () => {
    vi.mocked(getNeptuneEndpoints).mockRejectedValue(Object.assign(new Error('x'), { name: 'Boom' }));

    const [, error] = await invoke({ graphDatabaseName: 'graph' });

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
  });
});
