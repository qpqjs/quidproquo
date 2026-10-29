import { defineUserDirectory, ErrorTypeEnum, EventActionType, QpqFunctionRuntime } from '@qpqjs/core';
import { buildTestQpqConfig, resolveEventProcessor } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

const userDirectoryConfig = (runtime: QpqFunctionRuntime) =>
  buildTestQpqConfig([defineUserDirectory('ud', { customAuthRuntime: { defineAuthChallenge: runtime } })]);

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
