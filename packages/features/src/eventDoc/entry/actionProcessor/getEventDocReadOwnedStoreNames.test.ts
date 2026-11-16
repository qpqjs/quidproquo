import { ActionProcessor, DynamicModuleLoader } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { EventDocActionType } from '../../actions/EventDocActionType';
import { defineEventDocSummary } from '../../config/defineEventDocSummary';
import { getEventDocReadOwnedStoreNames } from './getEventDocReadOwnedStoreNames';

const loader = (async () => undefined) as unknown as DynamicModuleLoader;

// The processor ignores everything but its (empty) payload.
const runProcessor = async (processor: ActionProcessor<never>) => (processor as unknown as () => Promise<unknown>)();

describe('getEventDocReadOwnedStoreNames', () => {
  it("registers under the ReadOwnedStoreNames action and answers from the service's config", async () => {
    const processors = await getEventDocReadOwnedStoreNames(buildTestQpqConfig([defineEventDocSummary('envelopes')]), loader);

    expect(await runProcessor(processors![EventDocActionType.ReadOwnedStoreNames]!)).toMatchObject([['envelopes']]);
  });

  it('answers with none for a service with no event doc collections', async () => {
    const processors = await getEventDocReadOwnedStoreNames(buildTestQpqConfig(), loader);

    expect(await runProcessor(processors![EventDocActionType.ReadOwnedStoreNames]!)).toMatchObject([[]]);
  });
});
