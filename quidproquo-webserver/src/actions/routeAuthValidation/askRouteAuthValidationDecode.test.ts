import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { RouteAuthSettings } from '../../config/settings/route';
import { HTTPEvent } from '../../types/HTTPEvent';
import { askRouteAuthValidationDecode } from './askRouteAuthValidationDecode';
import { RouteAuthDecodeOutcome } from './RouteAuthDecodeOutcome';
import { RouteAuthDecodeResult } from './RouteAuthDecodeResult';
import { RouteAuthValidationActionType } from './RouteAuthValidationActionType';

const event = { headers: {}, path: '/' } as unknown as HTTPEvent;
const routeAuthSettings: RouteAuthSettings = { userDirectoryName: 'users' };

describe('askRouteAuthValidationDecode', () => {
  it('yields a Decode action with the event, settings and expiration flag', () => {
    const { action } = captureRequester(askRouteAuthValidationDecode(event, routeAuthSettings, true));

    expect(action).toEqual({
      type: RouteAuthValidationActionType.Decode,
      payload: { event, routeAuthSettings, ignoreExpiration: true },
    });
  });

  it('returns the valid decode result the runtime resolves', () => {
    const decodeResult: RouteAuthDecodeResult = {
      outcome: RouteAuthDecodeOutcome.valid,
      decodedAccessToken: { userId: 'u1', username: 'user', exp: 0, userDirectory: 'users', wasValid: true },
    };
    const { returned } = captureRequester(askRouteAuthValidationDecode(event, routeAuthSettings, false), decodeResult);

    expect(returned).toBe(decodeResult);
  });

  it('returns the invalid decode result the runtime resolves', () => {
    const decodeResult: RouteAuthDecodeResult = { outcome: RouteAuthDecodeOutcome.invalid };
    const { returned } = captureRequester(askRouteAuthValidationDecode(event, routeAuthSettings, false), decodeResult);

    expect(returned).toBe(decodeResult);
  });
});
