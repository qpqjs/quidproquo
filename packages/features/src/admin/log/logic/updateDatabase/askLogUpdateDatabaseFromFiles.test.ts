import { Action, ConfigActionType, FileActionType, KeyValueStoreActionType, QpqRuntimeType } from '@qpqjs/core';
import { buildStoryResult, runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askLogUpdateDatabaseFromFiles } from './askLogUpdateDatabaseFromFiles';

const baseStoryResult = buildStoryResult({
  correlation: 'mod::abc',
  moduleName: 'mod',
  runtimeType: QpqRuntimeType.UI,
  startedAt: '2026-06-26T00:00:00.000Z',
  finishedAt: '2026-06-26T00:00:01.000Z',
});

describe('askLogUpdateDatabaseFromFiles', () => {
  it('processes each file path with no ttl when retention is unset', () => {
    const upsertedCorrelations: string[] = [];

    runStory(askLogUpdateDatabaseFromFiles('drive', ['mod::abc.json']), {
      [ConfigActionType.GetGlobal]: undefined,
      [FileActionType.ReadObjectJson]: baseStoryResult,
      [KeyValueStoreActionType.Upsert]: (action: Action<any>) => {
        upsertedCorrelations.push(action.payload.item.correlation);
        expect(action.payload.item.ttl).toBeUndefined();
      },
    });

    expect(upsertedCorrelations).toEqual(['mod::abc']);
  });
});
