import { Action, KeyValueStoreActionType, QPQ_LOGS_STORAGE_DRIVE_NAME } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { LogMetadata } from '../../entry/domain/LogMetadata';
import { askLogMetadataUpsert } from './askLogMetadataUpsert';

const log = { correlation: 'c1' } as LogMetadata;

describe('askLogMetadataUpsert', () => {
  it('upserts the metadata into the logs store', () => {
    let captured: Action<any> | undefined;

    runStory(askLogMetadataUpsert(log), {
      [KeyValueStoreActionType.Upsert]: (action: Action<any>) => {
        captured = action;
        return undefined;
      },
    });

    expect(captured?.payload.keyValueStoreName).toBe(QPQ_LOGS_STORAGE_DRIVE_NAME);
    expect(captured?.payload.item).toBe(log);
  });
});
