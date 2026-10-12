import { captureRequester } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { RouteAuthSettings } from '../../config/settings/route';
import { HTTPEvent } from '../../types/HTTPEvent';
import { askRouteAuthValidationResolveContext } from './askRouteAuthValidationResolveContext';
import { RouteAuthValidationActionType } from './RouteAuthValidationActionType';

const event = { headers: {}, path: '/' } as unknown as HTTPEvent;
const routeAuthSettings: RouteAuthSettings = { userDirectoryName: 'users' };
const decodedAccessToken = { userId: 'u1', username: 'user', exp: 0, userDirectory: 'users', wasValid: true };

describe('askRouteAuthValidationResolveContext', () => {
  it('yields a ResolveContext action with the event, settings and validated token', () => {
    const { action } = captureRequester(askRouteAuthValidationResolveContext(event, routeAuthSettings, decodedAccessToken));

    expect(action).toEqual({
      type: RouteAuthValidationActionType.ResolveContext,
      payload: { event, routeAuthSettings, decodedAccessToken },
    });
  });

  it('returns the context the runtime resolves', () => {
    const context = { storageScope: 'TENANT#t1' };
    const { returned } = captureRequester(askRouteAuthValidationResolveContext(event, routeAuthSettings, null), context);

    expect(returned).toBe(context);
  });
});
