import { Action, DateActionType, FileActionType, KeyValueStoreActionType, QpqRuntimeType } from '@qpqjs/core';
import { buildStoryResult, runStory, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { REDACTED_STRING } from '../redaction/constants/REDACTED_STRING';
import { askLogUpdateDatabaseFromFile } from './askLogUpdateDatabaseFromFile';

const baseStoryResult = buildStoryResult({
  correlation: 'mod::abc',
  moduleName: 'mod',
  runtimeType: QpqRuntimeType.UI,
  startedAt: '2026-06-26T00:00:00.000Z',
  finishedAt: '2026-06-26T00:00:01.000Z',
});

describe('askLogUpdateDatabaseFromFile', () => {
  it('upserts the metadata for a readable log without notifying admins', () => {
    let upserted: any;

    runStory(askLogUpdateDatabaseFromFile('drive', 'mod::abc.json'), {
      [FileActionType.ReadObjectJson]: baseStoryResult,
      [KeyValueStoreActionType.Upsert]: (action: Action<any>) => {
        upserted = action.payload.item;
      },
    });

    expect(upserted.correlation).toBe('mod::abc');
    expect(upserted.error).toBeUndefined();
  });

  it('indexes only the redacted object', () => {
    // The access token is a known secret, so the sweep scrubs its value out of every string,
    // including the tag that becomes the generic column.
    const leaky = { ...baseStoryResult, session: { accessToken: 'tok-123' }, tags: ['issued tok-123'] };
    let upserted: any;

    runStory(askLogUpdateDatabaseFromFile('drive', 'mod::abc.json'), {
      [FileActionType.ReadObjectJson]: leaky,
      [KeyValueStoreActionType.Upsert]: (action: Action<any>) => {
        upserted = action.payload.item;
      },
    });

    expect(upserted.generic).toBe(`issued ${REDACTED_STRING}`);
    expect(leaky.tags).toEqual(['issued tok-123']);
  });

  it('builds error metadata and notifies admins when the file cannot be read', () => {
    let scanned = false;
    let upserted: any;

    runStory(askLogUpdateDatabaseFromFile('drive', 'mod::abc.json'), {
      [FileActionType.ReadObjectJson]: throwsError('NotFound', 'missing'),
      [DateActionType.Now]: '2026-06-26T00:00:00.000Z',
      [KeyValueStoreActionType.Upsert]: (action: Action<any>) => {
        upserted = action.payload.item;
      },
      [KeyValueStoreActionType.Scan]: () => {
        scanned = true;
        return { items: [], nextPageKey: undefined };
      },
    });

    expect(upserted.error).toBe('Error loading story result');
    expect(scanned).toBe(true);
  });
});
