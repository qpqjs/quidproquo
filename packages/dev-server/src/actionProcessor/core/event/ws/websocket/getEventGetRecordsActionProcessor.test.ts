import { buildTestQpqConfig, EventActionType, noopDynamicModuleLoader, resolveActionResult } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { invokeProcessor } from '../../../../../testing/testProcessorRuntime';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

const getProcess = async () => {
  const processors = await getEventGetRecordsActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
  return processors[EventActionType.GetRecords];
};

const invoke = async (wsEvent: any) => {
  const process = await getProcess();
  return invokeProcessor(process, { eventParams: [wsEvent] } as any);
};

const baseEvent = {
  eventType: 'message',
  messageId: 'm-1',
  connectionId: 'c-1',
  requestTimeEpoch: 0,
  sourceIp: '1.2.3.4',
  userAgent: 'agent',
  apiName: 'api',
};

describe('getEventGetRecordsActionProcessor (websocket)', () => {
  it('maps fields and derives an ISO request time from the epoch', async () => {
    const result = await invoke({ ...baseEvent, body: Buffer.from('hello') });

    const [record] = resolveActionResult(result);
    expect(record.requestTime).toBe(new Date(0).toISOString());
    expect(record.connectionId).toBe('c-1');
    expect(record.apiName).toBe('api');
  });

  it('decodes a Buffer body to a string', async () => {
    const result = await invoke({ ...baseEvent, body: Buffer.from('hello') });

    expect(resolveActionResult(result)[0].body).toBe('hello');
  });

  it('concatenates a Buffer array body', async () => {
    const result = await invoke({ ...baseEvent, body: [Buffer.from('foo'), Buffer.from('bar')] });

    expect(resolveActionResult(result)[0].body).toBe('foobar');
  });

  it('decodes an ArrayBuffer body', async () => {
    const result = await invoke({ ...baseEvent, body: new TextEncoder().encode('arr').buffer });

    expect(resolveActionResult(result)[0].body).toBe('arr');
  });

  it('leaves an undefined body undefined', async () => {
    const result = await invoke({ ...baseEvent, body: undefined });

    expect(resolveActionResult(result)[0].body).toBeUndefined();
  });

  it('throws for an unsupported body type', async () => {
    await expect(invoke({ ...baseEvent, body: 'a plain string' })).rejects.toThrow('Unsupported body type');
  });
});
