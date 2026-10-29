import { ActionProcessorListResolver, EventActionType } from '@qpqjs/core';

import { describe, expect, it } from 'vitest';

import { resolveEventProcessor } from './resolveEventProcessor';

describe('resolveEventProcessor', () => {
  it('returns the one processor keyed by the action type', async () => {
    const processor = async (): Promise<[string]> => ['matched'];
    const resolver: ActionProcessorListResolver = async () => ({ [EventActionType.MatchStory]: processor });

    const resolved = await resolveEventProcessor(resolver, EventActionType.MatchStory);

    expect(resolved).toBe(processor);
  });

  it('hands the resolver a default test config', async () => {
    let seenConfig: unknown;
    const resolver: ActionProcessorListResolver = async (qpqConfig) => {
      seenConfig = qpqConfig;
      return {};
    };

    await resolveEventProcessor(resolver, EventActionType.MatchStory);

    expect(Array.isArray(seenConfig)).toBe(true);
  });
});
