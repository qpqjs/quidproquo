import { buildTestQpqConfig } from '@qpqjs/core';
import { defineWebsocket, QpqWebSocketEventProcessors } from '@qpqjs/webserver';

import { request } from 'http';
import { Socket } from 'net';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ResolvedDevServerConfig } from '../../types';
import { findRegisteredWebSocketServer, sendMessageToWebSocketConnection } from './webSocketConnectionRegistry';
import { webSocketImplementation } from './webSocketImplementation';

// The connect/message/disconnect stories are not under test; only the socket bookkeeping is.
vi.mock('../../logic', async (importOriginal: () => Promise<Record<string, unknown>>) => ({
  ...(await importOriginal()),
  processEvent: vi.fn(async () => undefined),
}));

const WS_PORT = 47633;

// A syntactically valid handshake key (base64 of 16 bytes), the one from RFC 6455.
const SHARED_KEY = 'dGhlIHNhbXBsZSBub25jZQ==';

const openRawSocket = (key: string): Promise<Socket> =>
  new Promise((resolve, reject) => {
    const req = request({
      host: '127.0.0.1',
      port: WS_PORT,
      path: '/test-module/api',
      headers: {
        Connection: 'Upgrade',
        Upgrade: 'websocket',
        'Sec-WebSocket-Version': '13',
        'Sec-WebSocket-Key': key,
      },
    });
    req.on('upgrade', (_res, socket) => resolve(socket));
    req.on('response', (res) => reject(new Error(`handshake refused with ${res.statusCode}`)));
    req.on('error', reject);
    req.end();
  });

const waitForConnections = async (count: number): Promise<Record<string, unknown>> => {
  const deadline = Date.now() + 2000;
  for (;;) {
    const connections = findRegisteredWebSocketServer('test-module', 'api')?.connections ?? {};
    if (Object.keys(connections).length >= count || Date.now() > deadline) {
      return connections;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};

describe('sendMessageToWebSocketConnection', () => {
  it('resolves without throwing when no matching connection is registered', async () => {
    await expect(sendMessageToWebSocketConnection('svc-a', 'api', 'unknown-conn', { hi: true })).resolves.toBeUndefined();
  });
});

describe('webSocketImplementation connection ids', () => {
  let stop: (() => Promise<void>) | null = null;
  const sockets: Socket[] = [];

  beforeEach(async () => {
    const qpqConfig = buildTestQpqConfig([defineWebsocket('ws', {} as QpqWebSocketEventProcessors)]);
    stop = await webSocketImplementation({
      serverDomain: 'localhost',
      webSocketPort: WS_PORT,
      qpqConfigs: [qpqConfig],
      dynamicModuleLoader: async () => undefined,
    } as unknown as ResolvedDevServerConfig);
  });

  afterEach(async () => {
    sockets.splice(0).forEach((socket) => socket.destroy());
    await stop?.();
  });

  // The handshake key is chosen by the client, so two sockets presenting the same key must
  // not share a connection id: the second would replace the first in the registry and
  // receive everything addressed to it.
  it('registers two sockets that present the same handshake key as two connections', async () => {
    sockets.push(await openRawSocket(SHARED_KEY));
    sockets.push(await openRawSocket(SHARED_KEY));

    const connections = await waitForConnections(2);

    expect(Object.keys(connections)).toHaveLength(2);
    expect(Object.keys(connections)).not.toContain(SHARED_KEY);
  });
});
