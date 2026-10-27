import { actionResult, actionResultError, ErrorTypeEnum, KvsStreamEventType, KvsStreamRecord, QpqRuntimeType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getRecordsHistory, makeStoryResultBuilder } from '../../testing/genericTextExtractorTestHelpers';
import { kvsStreamEventGenericTextExtractor } from './kvsStreamEventGenericTextExtractor';

const buildStoryResult = makeStoryResultBuilder(QpqRuntimeType.KVS_STREAM_EVENT);

const streamRecord = (overrides: Partial<KvsStreamRecord>): KvsStreamRecord => ({
  keyValueStoreName: 'flowsEventLog',
  eventType: KvsStreamEventType.Modify,
  scope: 'tenant-abc',
  keys: { id: 'flow-123' },
  ...overrides,
});

describe('kvsStreamEventGenericTextExtractor', () => {
  it('extracts store, event type, scope and keys for every record in the batch', () => {
    const result = kvsStreamEventGenericTextExtractor(
      buildStoryResult({
        history: [
          getRecordsHistory(
            actionResult([
              streamRecord({ eventType: KvsStreamEventType.Insert, keys: { id: 'flow-1', eventId: '01J0' } }),
              streamRecord({ eventType: KvsStreamEventType.Remove, scope: 'tenant-xyz', keys: { id: 'flow-2' } }),
            ]),
          ),
        ],
      }),
    );

    expect(result).toEqual(['Insert::flowsEventLog - [tenant-abc] id=flow-1 eventId=01J0', 'Remove::flowsEventLog - [tenant-xyz] id=flow-2']);
  });

  // The whole point of surfacing scope: two tenants touching the same document id have to be
  // tellable apart in search, and an unscoped row has to be distinguishable from both.
  it('labels an unscoped row rather than leaving the scope blank', () => {
    const result = kvsStreamEventGenericTextExtractor(
      buildStoryResult({
        history: [getRecordsHistory(actionResult([streamRecord({ scope: undefined, keys: { id: 'flow-9' } })]))],
      }),
    );

    expect(result).toEqual(['Modify::flowsEventLog - [unscoped] id=flow-9']);
  });

  it('returns the error text when the get records action errored', () => {
    const result = kvsStreamEventGenericTextExtractor(
      buildStoryResult({
        history: [getRecordsHistory(actionResultError(ErrorTypeEnum.GenericError, 'boom'))],
      }),
    );

    expect(result).toEqual(['boom']);
  });

  it('returns nothing when the story is a different runtime type', () => {
    const result = kvsStreamEventGenericTextExtractor({
      ...buildStoryResult({ history: [getRecordsHistory(actionResult([streamRecord({})]))] }),
      runtimeType: QpqRuntimeType.QUEUE_EVENT,
    });

    expect(result).toEqual([]);
  });

  it('returns nothing when the story never fetched records', () => {
    expect(kvsStreamEventGenericTextExtractor(buildStoryResult({ history: [] }))).toEqual([]);
  });
});
