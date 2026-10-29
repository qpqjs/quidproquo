import { Action, KeyValueStoreActionType, QPQ_LOGS_STORAGE_DRIVE_NAME } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { LogMetadata } from '../../entry/domain/LogMetadata';
import { askLogMetadataSetChecked } from './askLogMetadataSetChecked';

describe('askLogMetadataSetChecked', () => {
  it('updates the metadata keyed by correlation and returns the updated model', () => {
    let captured: Action<any> | undefined;
    const updated = { correlation: 'c1', checked: true } as LogMetadata;

    const result = runStory(askLogMetadataSetChecked('c1', true, 'joe'), {
      [KeyValueStoreActionType.Update]: (action: Action<any>) => {
        captured = action;
        return updated;
      },
    });

    expect(captured?.payload.keyValueStoreName).toBe(QPQ_LOGS_STORAGE_DRIVE_NAME);
    expect(result).toBe(updated);
  });
});
