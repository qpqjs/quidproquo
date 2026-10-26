import { buildTestQpqConfig, buildTestStorySession, EventActionType, noopDynamicModuleLoader, resolveActionResult } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';

const invoke = async (eventStorySession: any, sessionCorrelation: string) => {
  const processors = await getEventGetStorySessionActionProcessor(buildTestQpqConfig(), noopDynamicModuleLoader);
  const process = processors[EventActionType.GetStorySession];
  return process(
    { eventParams: [{ storySession: eventStorySession }] } as any,
    buildTestStorySession({ correlation: sessionCorrelation }),
    {},
    undefined as any,
    () => {},
    async () => null,
    undefined as any,
  );
};

describe('getEventGetStorySessionActionProcessor (queue)', () => {
  it('merges the event story session and overrides correlation from the session', async () => {
    const result = await invoke({ depth: 2, context: { a: 1 }, correlation: 'event-corr' }, 'session-corr');

    expect(resolveActionResult(result)).toEqual({ depth: 2, context: { a: 1 }, correlation: 'session-corr' });
  });

  it('drops local context, function globals and the raw access token planted in the event', async () => {
    const result = await invoke(
      { depth: 1, context: { a: 1 }, localContext: { secret: 'x' }, functionGlobals: { g: 1 }, accessToken: 'raw.bearer', correlation: 'c' },
      'c',
    );

    expect(resolveActionResult(result)).toEqual({ depth: 1, context: { a: 1 }, correlation: 'c' });
  });

  it('falls back to the event correlation when the session has none', async () => {
    const result = await invoke({ depth: 0, context: {}, correlation: 'event-corr' }, '');

    expect(resolveActionResult(result).correlation).toBe('event-corr');
  });
});
