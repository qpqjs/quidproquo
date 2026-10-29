import { getEventAutoRespondNoopActionProcessor as getEventAutoRespondActionProcessor } from '@qpqjs/actionprocessor-js';
import { getEventGetStorySessionNoopActionProcessor as getEventGetStorySessionActionProcessor } from '@qpqjs/actionprocessor-js';
import { defineUserDirectory, ErrorTypeEnum, EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

const userDirectoryConfig = (runtime: QpqFunctionRuntime) =>
  buildTestQpqConfig([defineUserDirectory('ud', { customAuthRuntime: { createAuthChallenge: runtime } })]);

describe('cognito/createAuthChallenge getEventGetRecordsActionProcessor', () => {
  it('maps the trigger event session and user attributes', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const event = {
      userName: 'joe',
      request: {
        session: [{ challengeResult: true, challengeMetadata: 'emailCode' }],
        userAttributes: { email: 'a@b.com', sub: '123' },
      },
    };

    const [records] = await processor({ eventParams: [event, {}] });

    expect(records).toEqual([
      {
        userName: 'joe',
        session: [{ challengeName: 'emailCode', challengeResult: true }],
        userAttributes: { email: 'a@b.com', userId: '123' },
      },
    ]);
  });
});

describe('cognito/createAuthChallenge getEventMatchStoryActionProcessor', () => {
  it('returns a NotFound error when no createAuthChallenge runtime is configured', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor('ud'), EventActionType.MatchStory);

    const [, error] = await processor({ qpqEventRecord: {} });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('returns the configured createAuthChallenge runtime', async () => {
    const runtime: QpqFunctionRuntime = '/entry/auth::createChallenge';
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor('ud'), EventActionType.MatchStory, userDirectoryConfig(runtime));

    const [match] = await processor({ qpqEventRecord: {} });

    expect((match as any).runtime).toEqual(runtime);
  });
});

describe('cognito/createAuthChallenge getEventTransformResponseResultActionProcessor', () => {
  it('writes challenge parameters onto the trigger event response', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const event = { userName: 'joe', response: {} };
    const record = {
      success: true,
      result: { challengeName: 'emailCode', privateChallengeParameters: { answer: '1' }, publicChallengeParameters: { hint: 'h' } },
    };

    const [response] = await processor({ eventParams: [event], qpqEventRecordResponses: [record] });

    expect((response as any).response).toEqual({
      challengeMetadata: 'emailCode',
      privateChallengeParameters: { answer: '1' },
      publicChallengeParameters: { hint: 'h' },
    });
  });

  it('propagates a failed record as an error result', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const record = { success: false, error: { errorType: ErrorTypeEnum.Forbidden, errorText: 'no' } };

    const [, error] = await processor({ eventParams: [{ response: {} }], qpqEventRecordResponses: [record] });

    expect(error?.errorType).toBe(ErrorTypeEnum.Forbidden);
  });
});

describe('cognito/createAuthChallenge auto respond and story session', () => {
  it('auto responds with null', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond);

    expect(await processor({ qpqEventRecord: {}, matchResult: {} })).toEqual([null]);
  });

  it('returns no story session', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession);

    expect(await processor({ qpqEventRecord: {}, eventParams: [] })).toEqual([undefined]);
  });
});
