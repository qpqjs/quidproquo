import { describe, expect, it } from 'vitest';

import { actionResult } from '../logic/actionLogic';
import { createStreamRegistry } from '../logic/stream';
import { buildTestQpqConfig } from '../testing/configTesting';
import {
  buildActionProcessorList,
  buildTestStorySession,
  createStubLogger,
  getTestTimeNow,
  noopDynamicModuleLoader,
  testRandomGuid,
} from '../testing/runtimeTesting';
import { Action, ActionProcessor, DecodedAccessToken, StreamRegistry } from '../types';
import { AskResponse, QpqRuntimeType, StorySession } from '../types/StorySession';
import { createNestedRuntime } from './createNestedRuntime';

const PROBE = 'Test/Probe';

const decodedAccessToken: DecodedAccessToken = { userId: 'user-1', username: 'user', exp: 0, userDirectory: 'dir', wasValid: true };

type ProbeCapture = { session?: StorySession; streamRegistry?: StreamRegistry };

// Records the session and stream registry a processor inside the nested story receives.
const buildProbe = () => {
  const seen: ProbeCapture = {};
  const probe: ActionProcessor<Action<void>, null> = async (_payload, session, _processors, _logger, _update, _loader, streamRegistry) => {
    seen.session = session;
    seen.streamRegistry = streamRegistry;
    return actionResult(null);
  };

  return { seen, actionProcessors: buildActionProcessorList({ [PROBE]: probe }) };
};

function* askProbeStory(): AskResponse<string> {
  yield { type: PROBE };
  return 'done';
}

describe('createNestedRuntime', () => {
  it('carries the caller session into the nested story, minus the raw access token', async () => {
    const { seen, actionProcessors } = buildProbe();
    const callerSession = buildTestStorySession({
      depth: 2,
      context: { shared: 'ctx' },
      localContext: { local: 'only-here' },
      functionGlobals: { routeGlobal: 'g' },
      decodedAccessToken,
      accessToken: 'raw-token',
    });

    const runStory = createNestedRuntime(
      buildTestQpqConfig(),
      callerSession,
      actionProcessors,
      getTestTimeNow,
      createStubLogger(),
      testRandomGuid,
      QpqRuntimeType.EXECUTE_STORY,
      noopDynamicModuleLoader,
    );

    const result = await runStory(askProbeStory, []);

    expect(result.result).toBe('done');
    expect(result.correlation).toBe('test-module::guid-0');
    expect(result.fromCorrelation).toBe('corr-0');
    expect(seen.session?.depth).toBe(4);
    expect(seen.session?.context).toEqual({ shared: 'ctx' });
    expect(seen.session?.localContext).toEqual({ local: 'only-here' });
    expect(seen.session?.functionGlobals).toEqual({ routeGlobal: 'g' });
    expect(seen.session?.decodedAccessToken).toEqual(decodedAccessToken);
    expect(seen.session?.accessToken).toBeUndefined();
  });

  it("shares the caller's stream registry with the nested story", async () => {
    const { seen, actionProcessors } = buildProbe();
    const streamRegistry = createStreamRegistry();

    const runStory = createNestedRuntime(
      buildTestQpqConfig(),
      buildTestStorySession(),
      actionProcessors,
      getTestTimeNow,
      createStubLogger(),
      testRandomGuid,
      QpqRuntimeType.EXECUTE_IMPLEMENTATION_STORY,
      noopDynamicModuleLoader,
      undefined,
      ['tag-a'],
      streamRegistry,
    );

    const result = await runStory(askProbeStory, []);

    expect(seen.streamRegistry).toBe(streamRegistry);
    expect(result.runtimeType).toBe(QpqRuntimeType.EXECUTE_IMPLEMENTATION_STORY);
    expect(result.tags).toEqual(['tag-a']);
  });
});
