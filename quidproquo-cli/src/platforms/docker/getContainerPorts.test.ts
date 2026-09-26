import { WebEntryHost } from 'quidproquo-dev-server';

import { describe, expect, it } from 'vitest';

import { BASE_CONTAINER_PORTS, getContainerPorts } from './getContainerPorts';

describe('getContainerPorts', () => {
  it('is the fixed dev-server ports plus one per hosted web entry', () => {
    const hosts = [{ port: 3090 }, { port: 3091 }] as WebEntryHost[];

    expect(getContainerPorts(hosts)).toEqual([...BASE_CONTAINER_PORTS, 3090, 3091]);
  });
});
