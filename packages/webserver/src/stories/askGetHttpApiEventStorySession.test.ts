import { ErrorTypeEnum, runStory, StorySession, throwsError } from 'quidproquo-core';

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
const noContext = { [RouteAuthValidationActionType.ResolveContext]: {} };

describe('askGetHttpApiEventStorySession', () => {
  it('returns undefined when auth is not applicable and there is no access token', () => {
    const result = runStory(askGetHttpApiEventStorySession({ event: buildEvent(), session }), {
      [RouteAuthValidationActionType.Decode]: notApplicable,
      ...noContext,
    });

    expect(result).toBeUndefined();
  });

  it('decodes the token for logging only when auth is not applicable', () => {
    const token = encodeJwt({ sub: 'u1', username: 'alice', exp: 99 });
    const result = runStory(askGetHttpApiEventStorySession({ event: buildEvent({ authorization: `Bearer ${token}` }), session }), {
      [RouteAuthValidationActionType.Decode]: notApplicable,
      ...noContext,
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
      { [RouteAuthValidationActionType.Decode]: { outcome: RouteAuthDecodeOutcome.valid, decodedAccessToken: decoded }, ...noContext },
    );

    expect(result?.decodedAccessToken).toEqual(decoded);
  });

  it('attaches a custom validator token even when the route has no user directory', () => {
    // The always-yield rule exists for exactly this: a per-route override
    // validates its own way, and its identity must still reach the session.
    const decoded = { wasValid: true, userId: 'github-actions' };
    const result = runStory(askGetHttpApiEventStorySession({ event: buildEvent({ authorization: 'Bearer oidc-token' }), session }), {
      [RouteAuthValidationActionType.Decode]: { outcome: RouteAuthDecodeOutcome.valid, decodedAccessToken: decoded },
      ...noContext,
    });

    expect(result?.decodedAccessToken).toEqual(decoded);
  });

  it('merges the resolved context into the session, keeping what was there', () => {
    const decoded = { wasValid: true, userId: 'u1' };
    const result = runStory(
      askGetHttpApiEventStorySession({
        event: buildEvent({ authorization: 'Bearer token' }),
        session: { ...session, context: { existing: 'kept' } },
      }),
      {
        [RouteAuthValidationActionType.Decode]: { outcome: RouteAuthDecodeOutcome.valid, decodedAccessToken: decoded },
        [RouteAuthValidationActionType.ResolveContext]: { storageScope: 'TENANT#t1' },
      },
    );

    expect(result?.decodedAccessToken).toEqual(decoded);
    expect(result?.context).toEqual({ existing: 'kept', storageScope: 'TENANT#t1' });
  });

  it('returns a session for resolved context even without a token', () => {
    const result = runStory(askGetHttpApiEventStorySession({ event: buildEvent(), session }), {
      [RouteAuthValidationActionType.Decode]: notApplicable,
      [RouteAuthValidationActionType.ResolveContext]: { storageScope: 'PUBLIC' },
    });

    expect(result?.decodedAccessToken).toBeUndefined();
    expect(result?.context).toEqual({ storageScope: 'PUBLIC' });
  });

  it('never hands an unverified token to the context resolver', () => {
    const token = encodeJwt({ sub: 'forged-user', exp: 99 });
    let resolvedWith: unknown = 'not called';
    runStory(askGetHttpApiEventStorySession({ event: buildEvent({ authorization: `Bearer ${token}` }), session }), {
      [RouteAuthValidationActionType.Decode]: notApplicable,
      [RouteAuthValidationActionType.ResolveContext]: (action: { payload: { decodedAccessToken: unknown } }) => {
        resolvedWith = action.payload.decodedAccessToken;
        return {};
      },
    });

    expect(resolvedWith).toBeNull();
  });

  it('fails rather than returning a session without the context when the resolver rejects', () => {
    const story = askGetHttpApiEventStorySession({ event: buildEvent({ authorization: 'Bearer token' }), session });

    expect(() =>
      runStory(story, {
        [RouteAuthValidationActionType.Decode]: { outcome: RouteAuthDecodeOutcome.valid, decodedAccessToken: { wasValid: true, userId: 'u1' } },
        [RouteAuthValidationActionType.ResolveContext]: throwsError(ErrorTypeEnum.Forbidden, 'Not a member of this tenant'),
      }),
    ).toThrow('Not a member of this tenant');
  });
});
