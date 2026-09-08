import { buildTestQpqConfig, EventActionType, noopDynamicModuleLoader, resolveActionResult } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { invokeProcessor } from '../../../../../testing/testProcessorRuntime';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

describe('getEventGetRecordsActionProcessor (express)', () => {
  const getProcess = async () => {
    const processors = await getEventGetRecordsActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
    return processors[EventActionType.GetRecords];
  };

  const invoke = async (expressEvent: any) => {
    const process = await getProcess();
    return invokeProcessor(process, { eventParams: [expressEvent] } as any);
  };

  it('maps the express event into a base64-encoded internal record', async () => {
    const result = await invoke({
      path: '/users',
      query: { q: '1' },
      body: 'hello',
      headers: { 'content-type': 'text/plain' },
      method: 'POST',
      correlation: 'corr-1',
      ip: '1.2.3.4',
      files: ['a.txt'],
    });

    const [record] = resolveActionResult(result);
    expect(record).toEqual({
      path: '/users',
      query: { q: '1' },
      body: Buffer.from('hello').toString('base64'),
      headers: { 'content-type': 'text/plain' },
      method: 'POST',
      correlation: 'corr-1',
      sourceIp: '1.2.3.4',
      isBase64Encoded: true,
      files: ['a.txt'],
    });
  });

  it('passes a repeated query key through as a string array, matching api gateway', async () => {
    const result = await invoke({ method: 'GET', path: '/users', query: { a: '1', tag: ['x', 'y'] } });

    const [record] = resolveActionResult(result);
    expect(record.query).toEqual({ a: '1', tag: ['x', 'y'] });
  });

  it('leaves an undefined body undefined and defaults the path to empty', async () => {
    const result = await invoke({ method: 'GET' });

    const [record] = resolveActionResult(result);
    expect(record.body).toBeUndefined();
    expect(record.path).toBe('');
    expect(record.isBase64Encoded).toBe(true);
  });
});
