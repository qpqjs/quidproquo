import { runStory, StorySession } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { RouteAuthDecodeOutcome, RouteAuthValidationActionType } from '../actions/routeAuthValidation';
import { HTTPEvent } from '../types/HTTPEvent';
import { askGetHttpApiEventStorySession } from './askGetHttpApiEventStorySession';

const session = { correlation: 'corr', depth: 0, context: {} } as StorySession;

const encodeJwt = (payload: object): string => {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  return `header.${body}.signature`;
};

const buildEvent = (headers: Record<string, string> = {}) => ({ headers }) as unknown as HTTPEvent;

const notApplicable = { outcome: RouteAuthDecodeOutcome.notApplicable };

describe('askGetHttpApiEventStorySession', () => {
  it('returns undefined when auth is not applicable and there is no access token', () => {
    const result = runStory(askGetHttpApiEventStorySession({ event: buildEvent(), session }), {
      [RouteAuthValidationActionType.Decode]: notApplicable,
    });

    expect(result).toBeUndefined();
  });

  it('decodes the token for logging only when auth is not applicable', () => {
    const token = encodeJwt({ sub: 'u1', username: 'alice', exp: 99 });
    const result = runStory(askGetHttpApiEventStorySession({ event: buildEvent({ authorization: `Bearer ${token}` }), session }), {
      [RouteAuthValidationActionType.Decode]: notApplicable,
    });

    expect(result?.decodedAccessToken).toEqual({
      exp: 99,
      userDirectory: '',
      userId: 'u1',
      username: 'alice',
      wasValid: false,
    });
  });

  it('returns undefined when the decode outcome is invalid', () => {
    const result = runStory(
      askGetHttpApiEventStorySession({
        event: buildEvent({ authorization: 'Bearer token' }),
        routeAuthSettings: { userDirectoryName: 'users' },
        session,
      }),
      { [RouteAuthValidationActionType.Decode]: { outcome: RouteAuthDecodeOutcome.invalid } },
    );

    expect(result).toBeUndefined();
  });

  it('attaches the validated token to the session when the decode outcome is valid', () => {
    const decoded = { wasValid: true, userId: 'u1' };
    const result = runStory(
      askGetHttpApiEventStorySession({
        event: buildEvent({ authorization: 'Bearer token' }),
        routeAuthSettings: { userDirectoryName: 'users' },
        session,
      }),
      { [RouteAuthValidationActionType.Decode]: { outcome: RouteAuthDecodeOutcome.valid, decodedAccessToken: decoded } },
    );

    expect(result?.decodedAccessToken).toEqual(decoded);
  });

  it('attaches a custom validator token even when the route has no user directory', () => {
    // The always-yield rule exists for exactly this: a per-route override
    // validates its own way, and its identity must still reach the session.
    const decoded = { wasValid: true, userId: 'github-actions' };
    const result = runStory(askGetHttpApiEventStorySession({ event: buildEvent({ authorization: 'Bearer oidc-token' }), session }), {
      [RouteAuthValidationActionType.Decode]: { outcome: RouteAuthDecodeOutcome.valid, decodedAccessToken: decoded },
    });

    expect(result?.decodedAccessToken).toEqual(decoded);
  });
});
