import { defineUserDirectory, ErrorTypeEnum, EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

const userDirectoryConfig = (runtime: QpqFunctionRuntime) =>
  buildTestQpqConfig([
    defineUserDirectory('ud', { customAuthRuntime: { createAuthChallenge: runtime, defineAuthChallenge: runtime, verifyAuthChallenge: runtime } }),
  ]);

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
