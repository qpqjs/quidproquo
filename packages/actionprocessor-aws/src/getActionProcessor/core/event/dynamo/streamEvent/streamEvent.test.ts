import { EventActionType, KvsStreamEventType } from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

// The processor reads its configuration from the environment at module load, so this has to
// be in place before the import below is evaluated.
vi.hoisted(() => {
  process.env.keyValueStoreName = 'test-events';
  process.env.kvsStreamPartitionKey = 'pk';
  process.env.kvsStreamCoalesceByPartitionKey = 'true';
});

import { resolveEventProcessor } from '../../../../../testing/eventProcessorTestHelpers';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

const SCOPE_DELIMITER = '@@QPQSCOPE@@';

const buildStreamRecord = (eventName: string, pk: string, sk: string, extra: Record<string, unknown> = {}): any => ({
  eventName,
  dynamodb: {
    Keys: { pk: { S: pk }, sk: { S: sk } },
    NewImage: { pk: { S: pk }, sk: { S: sk }, ...extra },
  },
});

const getRecords = async (records: any[]) => {
  const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
  const [result] = await processor({ eventParams: [{ Records: records }, {}] });

  return result as any[];
};

describe('dynamo/streamEvent getEventGetRecordsActionProcessor', () => {
  it('lifts the scope out of the partition key and hands back raw keys', async () => {
    // Scope is composed into the stored pk. If a consumer saw the composed value it would
    // have to know the format and remember to undo it, and forgetting means acting on the
    // wrong tenant's data.
    const [record] = await getRecords([buildStreamRecord('INSERT', `tenant-a${SCOPE_DELIMITER}doc-1`, '0001')]);

    expect(record.scope).toBe('tenant-a');
    expect(record.keys.pk).toBe('doc-1');
    expect(record.newImage.pk).toBe('doc-1');
    expect(record.eventType).toBe(KvsStreamEventType.Insert);
  });

  it("drops a scoped row's hidden index copies from its images", async () => {
    const [record] = await getRecords([
      buildStreamRecord('INSERT', `tenant-a${SCOPE_DELIMITER}doc-1`, '0001', {
        category: { S: 'books' },
        '@@QPQGSI_category@@': { S: `tenant-a${SCOPE_DELIMITER}books` },
      }),
    ]);

    expect(record.newImage).toEqual({ pk: 'doc-1', sk: '0001', category: 'books' });
  });

  it('leaves an unscoped row alone', async () => {
    const [record] = await getRecords([buildStreamRecord('MODIFY', 'doc-1', '0001')]);

    expect(record.scope).toBeUndefined();
    expect(record.keys.pk).toBe('doc-1');
    expect(record.eventType).toBe(KvsStreamEventType.Modify);
  });

  it('coalesces to the LAST change per document', async () => {
    const records = await getRecords([
      buildStreamRecord('INSERT', 'doc-1', '0001', { marker: { S: 'first' } }),
      buildStreamRecord('INSERT', 'doc-1', '0002', { marker: { S: 'last' } }),
    ]);

    expect(records).toHaveLength(1);
    expect(records[0].newImage.marker).toBe('last');
  });

  it('does not coalesce the same id across different scopes', async () => {
    // The whole point of grouping on scope AND key. Keys are raw by this stage, so two
    // tenants legitimately share document ids; collapsing on the key alone would silently
    // drop one tenant's change because another tenant touched the same id in the same batch.
    const records = await getRecords([
      buildStreamRecord('INSERT', `tenant-a${SCOPE_DELIMITER}doc-1`, '0001'),
      buildStreamRecord('INSERT', `tenant-b${SCOPE_DELIMITER}doc-1`, '0001'),
      buildStreamRecord('INSERT', 'doc-1', '0001'),
    ]);

    expect(records).toHaveLength(3);
    expect(records.map((record) => record.scope)).toEqual(['tenant-a', 'tenant-b', undefined]);
    expect(records.every((record) => record.keys.pk === 'doc-1')).toBe(true);
  });

  it('collapses within each scope while keeping scopes apart, in one batch', async () => {
    // The realistic shape: several tenants, several documents, several changes each, all
    // arriving together. Coalescing has to be per (scope, document) — one rebuild each,
    // carrying that pair's LATEST change, and nobody's change lost to a neighbour's.
    const records = await getRecords([
      buildStreamRecord('INSERT', `tenant-a${SCOPE_DELIMITER}doc-1`, '0001', { marker: { S: 'a1-first' } }),
      buildStreamRecord('INSERT', `tenant-b${SCOPE_DELIMITER}doc-1`, '0001', { marker: { S: 'b1-first' } }),
      buildStreamRecord('MODIFY', `tenant-a${SCOPE_DELIMITER}doc-1`, '0002', { marker: { S: 'a1-last' } }),
      buildStreamRecord('INSERT', `tenant-a${SCOPE_DELIMITER}doc-2`, '0001', { marker: { S: 'a2-only' } }),
      buildStreamRecord('MODIFY', `tenant-b${SCOPE_DELIMITER}doc-1`, '0002', { marker: { S: 'b1-last' } }),
      buildStreamRecord('INSERT', 'doc-1', '0001', { marker: { S: 'unscoped-only' } }),
    ]);

    expect(records.map((record) => [record.scope, record.keys.pk, record.newImage.marker])).toEqual([
      // Order is first appearance in the batch; the value is that pair's last change.
      ['tenant-a', 'doc-1', 'a1-last'],
      ['tenant-b', 'doc-1', 'b1-last'],
      ['tenant-a', 'doc-2', 'a2-only'],
      [undefined, 'doc-1', 'unscoped-only'],
    ]);
  });

  it('rejects a record with no eventName rather than calling it a modify', async () => {
    await expect(getRecords([{ dynamodb: { Keys: { pk: { S: 'doc-1' }, sk: { S: '0001' } } } }])).rejects.toThrow(/eventName/);
  });
});
