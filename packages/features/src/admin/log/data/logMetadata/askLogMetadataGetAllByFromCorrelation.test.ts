import { KeyValueStoreActionType } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { LogMetadata } from '../../entry/domain/LogMetadata';
import { askLogMetadataGetAllByFromCorrelation } from './askLogMetadataGetAllByFromCorrelation';

const log = { correlation: 'c1' } as LogMetadata;

describe('askLogMetadataGetAllByFromCorrelation', () => {
  it('returns every item across the paged query', () => {
    const result = runStory(askLogMetadataGetAllByFromCorrelation('parent'), {
      [KeyValueStoreActionType.Query]: { items: [log, log] },
    });

    expect(result).toEqual([log, log]);
  });
});
