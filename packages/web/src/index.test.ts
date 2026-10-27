import { describe, expect, it } from 'vitest';

import * as quidproquoWeb from './index';

// The barrel is the published API surface: catch an accidental unwiring of a
// subtree before it ships.
describe('quidproquo-web public api', () => {
  it.each([
    ['askQueryParamsGet'],
    ['askQueryParamsGetAll'],
    ['askQueryParamsSet'],
    ['QueryParamsActionType'],
    ['askWindowGetLocation'],
    ['WindowActionType'],
    ['forceReloadFederatedRemote'],
    ['WebsocketService'],
    ['WebsocketServiceEvent'],
    ['formatTimeAgo'],
    ['getTimeAgoUpdateIntervalMs'],
    ['uniqueBy'],
  ])('exports %s', (exportName: string) => {
    expect(quidproquoWeb).toHaveProperty(exportName);
  });
});
