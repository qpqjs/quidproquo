import {
  Action,
  ActionProcessor,
  actionResult,
  buildTestQpqConfig,
  buildTestStorySession,
  createStreamRegistry,
  createStubLogger,
  DecodedAccessToken,
  ErrorTypeEnum,
  StorySession,
  StreamRegistry,
  SystemActionType,
} from 'quidproquo-core';

import { describe, expect, it, vi } from 'vitest';

import { invokeProcessor } from '../../../testing/processorTestHelpers';
import { getDateNow } from './getDateNow';
import { getSystemExecuteStoryActionProcessor } from './getSystemExecuteStoryActionProcessor';

const PROBE = 'Test/Probe';

type ProbeCapture = { session?: StorySession; streamRegistry?: StreamRegistry };

// Records the session and stream registry a processor inside the executed story receives.
const buildProbe = () => {
  const seen: ProbeCapture = {};
  const probe: ActionProcessor<Action<void>, null> = async (_payload, session, _processors, _logger, _update, _loader, streamRegistry) => {
    seen.session = session;
    seen.streamRegistry = streamRegistry;
    return actionResult(null);
  };

  return { seen, actionProcessors: { [PROBE]: probe } };
};

const probeStory = function* () {
  yield { type: PROBE };
  return 'done';
};

const resolveProcessor = async () => {
  const processors = await getSystemExecuteStoryActionProcessor(buildTestQpqConfig(), {} as any);
  return processors[SystemActionType.ExecuteStory];
};

describe('getDateNow', () => {
  it('returns an ISO timestamp', () => {
    expect(getDateNow()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });
});

describe('getSystemExecuteStoryActionProcessor', () => {
  it('returns a NotFound error when the runtime module cannot be loaded', async () => {
    const processor = await resolveProcessor();
    const loader = vi.fn().mockResolvedValue(null);

    const [, error] = await invokeProcessor(
      processor,
      { runtime: 'a/b::fn', params: [] },
      { session: buildTestStorySession(), logger: createStubLogger(), updateSession: vi.fn(), dynamicModuleLoader: loader },
    );

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('runs the loaded story and returns its result', async () => {
    const processor = await resolveProcessor();
    const story = function* () {
      return 'done';
    };
    const loader = vi.fn().mockResolvedValue(story);

    const result = await invokeProcessor(
      processor,
      { runtime: 'a/b::fn', params: [] },
      { session: buildTestStorySession(), logger: createStubLogger(), updateSession: vi.fn(), dynamicModuleLoader: loader },
    );

    expect(result).toEqual(['done']);
  });

  it("passes the caller's function globals and stream registry to the story", async () => {
    const processor = await resolveProcessor();
    const { seen, actionProcessors } = buildProbe();
    const streamRegistry = createStreamRegistry();

    await invokeProcessor(
      processor,
      { runtime: 'a/b::fn', params: [] },
      {
        session: buildTestStorySession({ functionGlobals: { routeGlobal: 'caller' } }),
        actionProcessors,
        logger: createStubLogger(),
        updateSession: vi.fn(),
        dynamicModuleLoader: vi.fn().mockResolvedValue(probeStory),
        streamRegistry,
      },
    );

    expect(seen.session?.functionGlobals).toEqual({ routeGlobal: 'caller' });
    expect(seen.streamRegistry).toBe(streamRegistry);
  });

  it('uses a payload session for context and user, but never its function globals', async () => {
    const processor = await resolveProcessor();
    const { seen, actionProcessors } = buildProbe();
    const decodedAccessToken: DecodedAccessToken = { userId: 'sender-user', username: 'u', exp: 0, userDirectory: 'dir', wasValid: true };

    // The shape askProcessEvent passes for a queue message: the sender's session, off the wire.
    const wireSession: StorySession = {
      depth: 0,
      context: { fromSender: 'ctx' },
      decodedAccessToken,
      correlation: 'sender-corr',
      functionGlobals: { senderGlobal: 'must-not-leak' },
    };

    await invokeProcessor(
      processor,
      { runtime: 'a/b::fn', params: [], storySession: wireSession },
      {
        session: buildTestStorySession({ localContext: { local: 'receiver' } }),
        actionProcessors,
        logger: createStubLogger(),
        updateSession: vi.fn(),
        dynamicModuleLoader: vi.fn().mockResolvedValue(probeStory),
        streamRegistry: createStreamRegistry(),
      },
    );

    expect(seen.session?.context).toEqual({ fromSender: 'ctx' });
    expect(seen.session?.decodedAccessToken).toEqual(decodedAccessToken);
    expect(seen.session?.localContext).toEqual({ local: 'receiver' });
    expect(seen.session?.functionGlobals).toEqual({});
  });
});
