import { runStory, throwsError, UserDirectoryActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { RouteAuthDecodeOutcome } from '../actions/routeAuthValidation';
import { HTTPEvent } from '../types/HTTPEvent';
import { askRouteAuthValidationDecodeDefault } from './askRouteAuthValidationDecodeDefault';

const buildPayload = (headers: Record<string, string>, userDirectoryName?: string) => ({
  event: { headers } as unknown as HTTPEvent,
  routeAuthSettings: { userDirectoryName },
  ignoreExpiration: false,
});

describe('askRouteAuthValidationDecodeDefault', () => {
  it('returns notApplicable when there is no user directory', () => {
    expect(runStory(askRouteAuthValidationDecodeDefault(buildPayload({})))).toEqual({ outcome: RouteAuthDecodeOutcome.notApplicable });
  });

  it('returns invalid when there is no authorization header', () => {
    expect(runStory(askRouteAuthValidationDecodeDefault(buildPayload({}, 'users')))).toEqual({ outcome: RouteAuthDecodeOutcome.invalid });
  });

  it('returns invalid when the authorization scheme is not Bearer', () => {
    expect(runStory(askRouteAuthValidationDecodeDefault(buildPayload({ Authorization: 'Basic abc' }, 'users')))).toEqual({
      outcome: RouteAuthDecodeOutcome.invalid,
    });
  });

  it('returns valid with the decoded token on success', () => {
    const decoded = { wasValid: true, userId: 'u1' };
    const result = runStory(askRouteAuthValidationDecodeDefault(buildPayload({ Authorization: 'Bearer token' }, 'users')), {
      [UserDirectoryActionType.DecodeAccessToken]: decoded,
    });

    expect(result).toEqual({ outcome: RouteAuthDecodeOutcome.valid, decodedAccessToken: decoded });
  });

  it('returns invalid when the token decodes but was not valid', () => {
    const result = runStory(askRouteAuthValidationDecodeDefault(buildPayload({ Authorization: 'Bearer token' }, 'users')), {
      [UserDirectoryActionType.DecodeAccessToken]: { wasValid: false, userId: 'u1' },
    });

    expect(result).toEqual({ outcome: RouteAuthDecodeOutcome.invalid });
  });

  it('returns invalid when decoding fails', () => {
    const result = runStory(askRouteAuthValidationDecodeDefault(buildPayload({ Authorization: 'Bearer token' }, 'users')), {
      [UserDirectoryActionType.DecodeAccessToken]: throwsError('SomeError', 'bad token'),
    });

    expect(result).toEqual({ outcome: RouteAuthDecodeOutcome.invalid });
  });
});
