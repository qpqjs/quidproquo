import { runStory } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { ApiKeyValidationActionType } from '../actions/apiKeyValidation';
import { RouteAuthDecodeOutcome, RouteAuthValidationActionType } from '../actions/routeAuthValidation';
import { HTTPEvent } from '../types/HTTPEvent';
import { askValidateRouteAuth } from './askValidateRouteAuth';

const buildEvent = (headers: Record<string, string> = {}) => ({ headers }) as unknown as HTTPEvent;

const notApplicable = { outcome: RouteAuthDecodeOutcome.notApplicable };
const invalid = { outcome: RouteAuthDecodeOutcome.invalid };
const valid = { outcome: RouteAuthDecodeOutcome.valid, decodedAccessToken: { wasValid: true, userId: 'u1' } };

describe('askValidateRouteAuth', () => {
  it('allows the request when there are no auth settings', () => {
    expect(runStory(askValidateRouteAuth({ event: buildEvent() }))).toBe(true);
  });

  it('allows a public route when the decode is not applicable', () => {
    const result = runStory(askValidateRouteAuth({ event: buildEvent(), routeAuthSettings: {} }), {
      [RouteAuthValidationActionType.Decode]: notApplicable,
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
      },
    );

    expect(result).toBe(true);
  });
});
