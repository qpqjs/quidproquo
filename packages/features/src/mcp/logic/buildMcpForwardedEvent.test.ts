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
});
