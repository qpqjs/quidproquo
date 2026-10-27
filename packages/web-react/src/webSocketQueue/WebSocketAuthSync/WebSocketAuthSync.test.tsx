import { createElement, ReactNode, useContext } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { WebSocketContext } from '../../websocket/WebsocketContext';
import { WebSocketAuthContext } from './WebSocketAuthContext';
import { WebSocketAuthSync } from './WebSocketAuthSync';

describe('WebSocketAuthSync', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('provides the authenticated flag and renders its children', () => {
    const service = {
      sendEvent: vi.fn(),
      isConnected: () => true,
      subscribe: vi.fn(() => ({ type: 'h' })),
      unsubscribe: vi.fn(),
      subscribeToEvent: vi.fn(() => ({ type: 'h' })),
    } as any;

    let authenticated: boolean | undefined;
    const Probe = () => {
      authenticated = useContext(WebSocketAuthContext);
      return createElement('span', null, 'child');
    };
    const wrapper = ({ children }: { children: ReactNode }) => createElement(WebSocketContext.Provider, { value: service }, children);

    const { getByText } = render(createElement(WebSocketAuthSync, { accessToken: 'tok' }, createElement(Probe)), { wrapper });

    expect(getByText('child')).toBeDefined();
    expect(authenticated).toBe(false);
  });
});
