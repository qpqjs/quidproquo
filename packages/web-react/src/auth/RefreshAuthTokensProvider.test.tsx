import { AuthenticationInfo } from 'quidproquo-core';

import { createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

import { RefreshAuthTokensProvider } from './RefreshAuthTokensProvider';

describe('RefreshAuthTokensProvider', () => {
  beforeEach(() => vi.useFakeTimers().setSystemTime(new Date('2026-06-26T12:00:00.000Z')));
  afterEach(() => vi.useRealTimers());

  it('renders its children', () => {
    const { getByText } = render(createElement(RefreshAuthTokensProvider, { refreshTokens: vi.fn() }, createElement('span', null, 'child')));

    expect(getByText('child')).toBeDefined();
  });

  it('drives a token refresh when expiry is within the buffer', () => {
    const refreshTokens = vi.fn().mockResolvedValue(undefined);
    const authenticationInfo = {
      accessToken: 'a',
      refreshToken: 'r',
      expiresAt: new Date(Date.now() + 60 * 1000).toISOString(),
    } as AuthenticationInfo;

    render(createElement(RefreshAuthTokensProvider, { authenticationInfo, refreshTokens }, null));

    expect(refreshTokens).toHaveBeenCalledWith(authenticationInfo);
  });
});
