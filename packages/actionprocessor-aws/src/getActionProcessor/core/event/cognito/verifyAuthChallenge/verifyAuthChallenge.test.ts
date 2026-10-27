import { buildTestQpqConfig, ErrorTypeEnum, EventActionType, QPQCoreConfigSettingType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { resolveEventProcessor } from '../../../../../testing/eventProcessorTestHelpers';
import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';
import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

// GLOBAL_USER_DIRECTORY_NAME is read from process.env at import time (undefined in tests).
const userDirectoryConfig = (runtime: unknown) =>
  buildTestQpqConfig([
    { configSettingType: QPQCoreConfigSettingType.userDirectory, name: undefined, customAuthRuntime: { verifyAuthChallenge: runtime } } as any,
  ]);

describe('cognito/verifyAuthChallenge getEventGetRecordsActionProcessor', () => {
  it('parses a json challenge answer', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const event = {
      request: {
        challengeAnswer: JSON.stringify({ code: '1234' }),
        userAttributes: { email: 'a@b.com' },
        userNotFound: false,
        privateChallengeParameters: { answer: '1234' },
      },
    };

    const [records] = await processor({ eventParams: [event, {}] });

    expect(records).toEqual([
      {
        challengeAnswer: { code: '1234' },
        userAttributes: { email: 'a@b.com' },
        userNotFound: false,
        privateChallengeParameters: { answer: '1234' },
      },
    ]);
  });

  it('defaults the challenge answer to an empty object when absent', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const event = { request: { challengeAnswer: '', userAttributes: {}, userNotFound: true, privateChallengeParameters: {} } };

    const [records] = await processor({ eventParams: [event, {}] });

    expect((records as any[])[0].challengeAnswer).toEqual({});
  });
});

describe('cognito/verifyAuthChallenge getEventMatchStoryActionProcessor', () => {
  it('returns a NotFound error when no verifyAuthChallenge runtime is configured', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory);

    const [, error] = await processor({ qpqEventRecord: {} });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('returns the configured verifyAuthChallenge runtime', async () => {
    const runtime = { src: 'verifyChallenge' };
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory, userDirectoryConfig(runtime));

    const [match] = await processor({ qpqEventRecord: {} });

    expect((match as any).runtime).toEqual(runtime);
  });
});

describe('cognito/verifyAuthChallenge getEventTransformResponseResultActionProcessor', () => {
  it('writes answerCorrect from a successful record', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const record = { success: true, result: { answerCorrect: true } };

    const [response] = await processor({ eventParams: [{ response: {} }], qpqEventRecordResponses: [record] });

    expect((response as any).response).toEqual({ answerCorrect: true });
  });

  it('marks the answer incorrect when the record errored', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const record = { success: false, error: { errorType: ErrorTypeEnum.GenericError, errorText: 'boom' } };

    const [response] = await processor({ eventParams: [{ response: {} }], qpqEventRecordResponses: [record] });

    expect((response as any).response).toEqual({ answerCorrect: false });
  });
});

describe('cognito/verifyAuthChallenge auto respond and story session', () => {
  it('auto responds with null', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond);

    expect(await processor({ qpqEventRecord: {}, matchResult: {} })).toEqual([null]);
  });

  it('returns no story session', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession);

    expect(await processor({ qpqEventRecord: {}, eventParams: [] })).toEqual([undefined]);
  });
});
