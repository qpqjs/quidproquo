import { WebEntryHost } from 'quidproquo-dev-server';

import { describe, expect, it } from 'vitest';

import { getContainerPorts } from './getContainerPorts';

describe('getContainerPorts', () => {
  it('is the dev-server ports plus one per hosted web entry', () => {
    const hosts = [{ port: 3090 }, { port: 3091 }] as WebEntryHost[];

    expect(getContainerPorts({ api: 8080, webSocket: 8888, fileStorage: 3001 }, hosts)).toEqual([8080, 8888, 3001, 3090, 3091]);
  });
});
