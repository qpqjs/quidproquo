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
    { configSettingType: QPQCoreConfigSettingType.userDirectory, name: undefined, customAuthRuntime: { defineAuthChallenge: runtime } } as any,
  ]);

describe('cognito/defineAuthChallenge getEventGetRecordsActionProcessor', () => {
  it('maps the trigger event session and user attributes', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);
    const event = { userName: 'joe', request: { session: [], userAttributes: { email: 'a@b.com' } } };

    const [records] = await processor({ eventParams: [event, {}] });

    expect(records).toEqual([{ userName: 'joe', session: [], userAttributes: { email: 'a@b.com' } }]);
  });
});

describe('cognito/defineAuthChallenge getEventMatchStoryActionProcessor', () => {
  it('returns a NotFound error when no defineAuthChallenge runtime is configured', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory);

    const [, error] = await processor({ qpqEventRecord: {} });

    expect(error?.errorType).toBe(ErrorTypeEnum.NotFound);
  });

  it('returns the configured defineAuthChallenge runtime', async () => {
    const runtime = { src: 'defineChallenge' };
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory, userDirectoryConfig(runtime));

    const [match] = await processor({ qpqEventRecord: {} });

    expect((match as any).runtime).toEqual(runtime);
  });
});

describe('cognito/defineAuthChallenge getEventTransformResponseResultActionProcessor', () => {
  it('issues a custom challenge when runCreateAuthChallenge is set', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const record = { success: true, result: { runCreateAuthChallenge: true, failAuthentication: false, issueTokens: false } };

    const [response] = await processor({ eventParams: [{ response: {} }], qpqEventRecordResponses: [record] });

    expect((response as any).response).toEqual({ failAuthentication: false, challengeName: 'CUSTOM_CHALLENGE', issueTokens: false });
  });

  it('fails authentication when the record errored', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const record = { success: false, error: { errorType: ErrorTypeEnum.GenericError, errorText: 'boom' } };

    const [response] = await processor({ eventParams: [{ response: {} }], qpqEventRecordResponses: [record] });

    expect((response as any).response).toEqual({ failAuthentication: true, challengeName: '', issueTokens: false });
  });
});

describe('cognito/defineAuthChallenge auto respond and story session', () => {
  it('auto responds with null', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond);

    expect(await processor({ qpqEventRecord: {}, matchResult: {} })).toEqual([null]);
  });

  it('returns no story session', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession);

    expect(await processor({ qpqEventRecord: {}, eventParams: [] })).toEqual([undefined]);
  });
});
