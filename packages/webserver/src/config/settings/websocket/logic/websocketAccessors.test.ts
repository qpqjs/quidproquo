import { buildTestQpqConfig } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { defineWebsocket } from '../defineWebsocket';
import { getAllWebsocketConfigs } from './getAllWebsocketConfigs';
import { getOwnedWebsocketConfigs } from './getOwnedWebsocketConfigs';
import { getWebsocketByName } from './getWebsocketByName';
import { resolveWebsocketOrThrow } from './resolveWebsocketOrThrow';

const config = buildTestQpqConfig([
  defineWebsocket('ws', {}, { apiName: 'realtime' }),
  defineWebsocket('shared', {}, { apiName: 'shared', owner: { module: 'other', websocketApiName: 'shared' } }),
]);

describe('websocket accessors', () => {
  it('lists every websocket, and only the owned ones', () => {
    expect(getAllWebsocketConfigs(config).map((websocket) => websocket.apiName)).toEqual(['realtime', 'shared']);
    expect(getOwnedWebsocketConfigs(config).map((websocket) => websocket.apiName)).toEqual(['realtime']);
  });

  it('finds a websocket by api name, null when unknown', () => {
    expect(getWebsocketByName('realtime', config)?.apiSubdomain).toBe('ws');
    expect(getWebsocketByName('missing', config)).toBeNull();
  });

  it('resolves a websocket by api name or throws naming it', () => {
    expect(resolveWebsocketOrThrow('shared', config).apiName).toBe('shared');
    expect(() => resolveWebsocketOrThrow('missing', config)).toThrow('No websocket setting found for api [missing]');
  });
});
