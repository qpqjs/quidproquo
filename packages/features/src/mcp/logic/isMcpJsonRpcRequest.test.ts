import { describe, expect, it } from 'vitest';

import { isMcpJsonRpcRequest } from './isMcpJsonRpcRequest';

// Security regression: the endpoint handles exactly one JSON-RPC 2.0 object with a string method; batches, bare values
// and malformed envelopes never reach the method switch.
describe('isMcpJsonRpcRequest', () => {
  it('accepts a minimal request and a notification', () => {
    expect(isMcpJsonRpcRequest({ jsonrpc: '2.0', id: 1, method: 'ping' })).toBe(true);
    expect(isMcpJsonRpcRequest({ jsonrpc: '2.0', method: 'notifications/initialized' })).toBe(true);
    expect(isMcpJsonRpcRequest({ jsonrpc: '2.0', id: 'a', method: 'tools/call', params: { name: 'x' } })).toBe(true);
  });

  it.each([
    [[{ jsonrpc: '2.0', id: 1, method: 'ping' }]],
    [null],
    ['{"jsonrpc":"2.0"}'],
    [42],
    [{ id: 1, method: 'ping' }],
    [{ jsonrpc: '1.0', id: 1, method: 'ping' }],
    [{ jsonrpc: '2.0', id: 1, method: ['ping'] }],
    [{ jsonrpc: '2.0', id: 1, method: 'ping', params: ['x'] }],
    [{ jsonrpc: '2.0', id: 1, method: 'ping', params: 'x' }],
    [{ jsonrpc: '2.0', id: { nested: true }, method: 'ping' }],
    [{ jsonrpc: '2.0', id: true, method: 'ping' }],
  ])('refuses %j', (body: any) => {
    expect(isMcpJsonRpcRequest(body)).toBe(false);
  });
});
