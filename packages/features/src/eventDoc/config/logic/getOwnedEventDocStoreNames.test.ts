import { defineKeyValueStore } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { defineEventDocSummary } from '../defineEventDocSummary';
import { getOwnedEventDocStoreNames } from './getOwnedEventDocStoreNames';

describe('getOwnedEventDocStoreNames', () => {
  it('names each collection store once, whatever other stores the service has', () => {
    const config = buildTestQpqConfig([defineEventDocSummary('envelopes'), defineEventDocSummary('signers'), defineKeyValueStore('sessions', 'id')]);

    expect(getOwnedEventDocStoreNames(config)).toEqual(['envelopes', 'signers']);
  });

  it("leaves out a collection another service owns: that service's deploy projects it, and reprojects it", () => {
    const shared = defineEventDocSummary('reports', { owner: { module: 'template' } });

    expect(getOwnedEventDocStoreNames(buildTestQpqConfig([shared], { moduleName: 'template' }))).toEqual(['reports']);
    expect(getOwnedEventDocStoreNames(buildTestQpqConfig([shared], { moduleName: 'sign' }))).toEqual([]);
  });
});
