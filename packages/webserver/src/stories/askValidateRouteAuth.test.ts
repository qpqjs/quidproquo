import { ErrorTypeEnum } from '@qpqjs/core';
import { runStory, throwsError } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { ApiKeyValidationActionType } from '../actions/apiKeyValidation';
import { RouteAuthDecodeOutcome, RouteAuthValidationActionType } from '../actions/routeAuthValidation';
import { HTTPEvent } from '../types/HTTPEvent';
import { askValidateRouteAuth } from './askValidateRouteAuth';

const buildEvent = (headers: Record<string, string> = {}) => ({ headers }) as unknown as HTTPEvent;

const notApplicable = { outcome: RouteAuthDecodeOutcome.notApplicable };
const invalid = { outcome: RouteAuthDecodeOutcome.invalid };
const valid = { outcome: RouteAuthDecodeOutcome.valid, decodedAccessToken: { wasValid: true, userId: 'u1' } };
const noContext = { [RouteAuthValidationActionType.ResolveContext]: {} };

describe('askValidateRouteAuth', () => {
  it('allows the request when there are no auth settings', () => {
    expect(runStory(askValidateRouteAuth({ event: buildEvent() }))).toBe(true);
  });

  it('allows a public route when the decode is not applicable', () => {
    const result = runStory(askValidateRouteAuth({ event: buildEvent(), routeAuthSettings: {} }), {
      [RouteAuthValidationActionType.Decode]: notApplicable,
      ...noContext,
    });

    expect(result).toBe(true);
  });

  it('always yields the decode, even without a user directory, so an override can reject', () => {
    const result = runStory(askValidateRouteAuth({ event: buildEvent(), routeAuthSettings: {} }), {
      [RouteAuthValidationActionType.Decode]: invalid,
    });

    expect(result).toBe(false);
  });

  it('rejects when the decode outcome is invalid', () => {
    const result = runStory(askValidateRouteAuth({ event: buildEvent(), routeAuthSettings: { userDirectoryName: 'users' } }), {
      [RouteAuthValidationActionType.Decode]: invalid,
    });

    expect(result).toBe(false);
  });

  it('allows when the decode outcome is valid', () => {
    const result = runStory(askValidateRouteAuth({ event: buildEvent(), routeAuthSettings: { userDirectoryName: 'users' } }), {
      [RouteAuthValidationActionType.Decode]: valid,
      ...noContext,
    });

    expect(result).toBe(true);
  });

  it('rejects when an api key is required but absent', () => {
    const result = runStory(askValidateRouteAuth({ event: buildEvent(), routeAuthSettings: { apiKeys: [{ name: 'k1' }] } }), {
      [RouteAuthValidationActionType.Decode]: notApplicable,
    });

    expect(result).toBe(false);
  });

  it('rejects when the api key is invalid', () => {
    const result = runStory(
      askValidateRouteAuth({ event: buildEvent({ 'x-api-key': 'secret' }), routeAuthSettings: { apiKeys: [{ name: 'k1' }] } }),
      {
        [RouteAuthValidationActionType.Decode]: notApplicable,
        [ApiKeyValidationActionType.Validate]: false,
      },
    );

    expect(result).toBe(false);
  });

  it('allows the request when token and api key both validate', () => {
    const result = runStory(
      askValidateRouteAuth({
        event: buildEvent({ 'x-api-key': 'secret' }),
        routeAuthSettings: { userDirectoryName: 'users', apiKeys: [{ name: 'k1' }] },
      }),
      {
        [RouteAuthValidationActionType.Decode]: valid,
        [ApiKeyValidationActionType.Validate]: true,
        ...noContext,
      },
    );

    expect(result).toBe(true);
  });

  it('resolves context with the validated token', () => {
    let resolvedWith: unknown;
    runStory(askValidateRouteAuth({ event: buildEvent(), routeAuthSettings: { userDirectoryName: 'users' } }), {
      [RouteAuthValidationActionType.Decode]: valid,
      [RouteAuthValidationActionType.ResolveContext]: (action: { payload: { decodedAccessToken: unknown } }) => {
        resolvedWith = action.payload.decodedAccessToken;
        return {};
      },
    });

    expect(resolvedWith).toEqual(valid.decodedAccessToken);
  });

  it('resolves context with no token when the decode is not applicable', () => {
    let resolvedWith: unknown = 'not called';
    runStory(askValidateRouteAuth({ event: buildEvent(), routeAuthSettings: {} }), {
      [RouteAuthValidationActionType.Decode]: notApplicable,
      [RouteAuthValidationActionType.ResolveContext]: (action: { payload: { decodedAccessToken: unknown } }) => {
        resolvedWith = action.payload.decodedAccessToken;
        return {};
      },
    });

    expect(resolvedWith).toBeNull();
  });

  it('fails when the context override rejects, so the preamble 401s', () => {
    const story = askValidateRouteAuth({ event: buildEvent(), routeAuthSettings: { userDirectoryName: 'users' } });

    expect(() =>
      runStory(story, {
        [RouteAuthValidationActionType.Decode]: valid,
        [RouteAuthValidationActionType.ResolveContext]: throwsError(ErrorTypeEnum.Forbidden, 'Not a member of this tenant'),
      }),
    ).toThrow('Not a member of this tenant');
  });

  it('does not resolve context for a request that already failed auth', () => {
    // No ResolveContext mock: yielding it would throw a test setup error.
    const result = runStory(askValidateRouteAuth({ event: buildEvent(), routeAuthSettings: { userDirectoryName: 'users' } }), {
      [RouteAuthValidationActionType.Decode]: invalid,
    });

    expect(result).toBe(false);
  });
});
