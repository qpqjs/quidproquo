import { defineUserDirectory, ErrorTypeEnum, EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';

const userDirectoryConfig = (runtime: QpqFunctionRuntime) =>
  buildTestQpqConfig([
    defineUserDirectory('ud', { customAuthRuntime: { createAuthChallenge: runtime, defineAuthChallenge: runtime, verifyAuthChallenge: runtime } }),
  ]);

describe('cognito/verifyAuthChallenge getEventMatchStoryActionProcessor', () => {
  it('returns a NotFound error when no verifyAuthChallenge runtime is configured', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor('ud'), EventActionType.MatchStory);

    const [, error] = await processor({ qpqEventRecord: {} });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('returns the configured verifyAuthChallenge runtime', async () => {
    const runtime: QpqFunctionRuntime = '/entry/auth::verifyChallenge';
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor('ud'), EventActionType.MatchStory, userDirectoryConfig(runtime));

    const [match] = await processor({ qpqEventRecord: {} });

    expect((match as any).runtime).toEqual(runtime);
  });
});
