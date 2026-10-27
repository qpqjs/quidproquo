import { HTTPEvent } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { buildMcpForwardedEvent } from './buildMcpForwardedEvent';

describe('buildMcpForwardedEvent', () => {
  it('drops credentials whatever their case and keeps everything else', () => {
    const event = {
      path: '/mcp',
      body: '{"jsonrpc":"2.0"}',
      headers: { Authorization: 'Basic abc', COOKIE: 's=1', 'X-Api-Key': 'k', 'content-type': 'application/json' },
    } as unknown as HTTPEvent;

    expect(buildMcpForwardedEvent(event)).toEqual({ path: '/mcp', body: '{"jsonrpc":"2.0"}', headers: { 'content-type': 'application/json' } });
  });

  // Security regression: the tenant header the exporter's scope resolver needs survives, while every credential header
  // is gone whatever its case, so the exporting service places the call without ever seeing a credential.
  it('keeps the tenant header and drops every credential header', () => {
    const event = {
      path: '/mcp',
      body: '{}',
      headers: { 'x-qpq-tenant-id': 'tenant-a', authorization: 'Bearer t', Cookie: 'a=b', 'x-API-key': 'k', host: 'api.example.com' },
    } as unknown as HTTPEvent;

    const forwarded = buildMcpForwardedEvent(event);

    expect(forwarded.headers).toEqual({ 'x-qpq-tenant-id': 'tenant-a', host: 'api.example.com' });
    expect(JSON.stringify(forwarded)).not.toContain('Bearer t');
  });
});
