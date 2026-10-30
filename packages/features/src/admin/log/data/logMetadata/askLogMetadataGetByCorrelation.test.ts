import { KeyValueStoreActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { LogMetadata } from '../../entry/domain/LogMetadata';
import { askLogMetadataGetByCorrelation } from './askLogMetadataGetByCorrelation';

const log = { correlation: 'c1' } as LogMetadata;

describe('askLogMetadataGetByCorrelation', () => {
  it('returns the first matching log', () => {
    const result = runStory(askLogMetadataGetByCorrelation('c1'), {
      [KeyValueStoreActionType.Query]: { items: [log] },
    });

    expect(result).toBe(log);
  });

  it('returns undefined when nothing matches', () => {
    const result = runStory(askLogMetadataGetByCorrelation('c1'), {
      [KeyValueStoreActionType.Query]: { items: [] },
    });

    expect(result).toBeUndefined();
  });
});
