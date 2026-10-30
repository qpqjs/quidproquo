import { describe, expect, it } from 'vitest';

import { websocketConnectionInfoContext } from './websocketConnectionInfoContext';

describe('websocketConnectionInfoContext', () => {
  it('defaults to an empty connection info under the qpq key', () => {
    expect(websocketConnectionInfoContext.defaultValue).toEqual({});
    expect(websocketConnectionInfoContext.uniqueName).toBe('qpq-websocket-connection-info');
  });
});
