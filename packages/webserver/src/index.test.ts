import { describe, expect, it } from 'vitest';

import * as webserver from './index';

describe('quidproquo-webserver barrel', () => {
  it('loads and exposes the qpqWebServerUtils namespace', () => {
    expect(webserver.qpqWebServerUtils).toBeDefined();
    expect(typeof webserver.qpqWebServerUtils.getHeaderValue).toBe('function');
  });

  it('re-exports the utils at the top level too', () => {
    expect(typeof webserver.getCorsHeaders).toBe('function');
    expect(typeof webserver.unsafeDecodeJWTPayload).toBe('function');
  });

  it('re-exports the event type constants', () => {
    expect(webserver.qpqHeaderIsBot).toBe('x-qpq-is-bot');
    expect(webserver.WebSocketEventType.Connect).toBe('CONNECT');
  });
});
