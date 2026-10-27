import {
  ActionProcessorResult,
  actionResult,
  actionResultError,
  buildActionProcessorList,
  buildTestQpqConfig,
  buildTestStorySession,
  createStreamRegistry,
  createStubLogger,
  ErrorTypeEnum,
  noopDynamicModuleLoader,
  UserDirectoryActionType,
} from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { RouteAuthDecodeOutcome, RouteAuthValidationActionType } from '../../actions/routeAuthValidation';
import { HTTPEvent } from '../../types/HTTPEvent';
import { getRouteAuthValidationDecodeActionProcessor } from './getRouteAuthValidationDecodeActionProcessor';

const invoke = async (payload: unknown, decodeProcessor: () => ActionProcessorResult<unknown>) => {
  const qpqConfig = buildTestQpqConfig();
  const processors = await getRouteAuthValidationDecodeActionProcessor(qpqConfig, noopDynamicModuleLoader);
  const processor = processors[RouteAuthValidationActionType.Decode];

  return processor(
    payload,
    buildTestStorySession(),
    buildActionProcessorList({ [UserDirectoryActionType.DecodeAccessToken]: async () => decodeProcessor() }),
    createStubLogger(),
    () => {},
    noopDynamicModuleLoader,
    createStreamRegistry(),
  );
};

const buildPayload = (headers: Record<string, string>) => ({
  event: { headers } as unknown as HTTPEvent,
  routeAuthSettings: { userDirectoryName: 'users' },
  ignoreExpiration: false,
});

describe('getRouteAuthValidationDecodeActionProcessor', () => {
  it('returns a valid outcome with the decoded token when the inner story succeeds', async () => {
    const decoded = { wasValid: true, userId: 'u1' };
    const [result] = await invoke(buildPayload({ Authorization: 'Bearer token' }), () => actionResult(decoded));

    expect(result).toEqual({ outcome: RouteAuthDecodeOutcome.valid, decodedAccessToken: decoded });
  });

  it('returns notApplicable when no user directory is configured', async () => {
    const [result] = await invoke({ event: { headers: {} }, routeAuthSettings: {}, ignoreExpiration: false }, () => actionResult(null));

    expect(result).toEqual({ outcome: RouteAuthDecodeOutcome.notApplicable });
  });

  it('returns invalid (fails closed) when the decode action errors', async () => {
    const [result] = await invoke(buildPayload({ Authorization: 'Bearer token' }), () => actionResultError(ErrorTypeEnum.GenericError, 'boom'));

    expect(result).toEqual({ outcome: RouteAuthDecodeOutcome.invalid });
  });
});
