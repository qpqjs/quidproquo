import { AuthenticationInfo, getQpqIsoDateTimeFromDate } from 'quidproquo-core';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useRefreshTokens } from './useRefreshTokens';

const buildInfo = (overrides: Partial<AuthenticationInfo>): AuthenticationInfo =>
  ({
    accessToken: 'a',
    refreshToken: 'r',
    expiresAt: getQpqIsoDateTimeFromDate(new Date(Date.now() + 60 * 60 * 1000)),
    ...overrides,
  }) as AuthenticationInfo;

describe('useRefreshTokens', () => {
  beforeEach(() => vi.useFakeTimers().setSystemTime(new Date('2026-06-26T12:00:00.000Z')));
  afterEach(() => vi.useRealTimers());

  it('schedules a refresh ahead of expiry', () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const info = buildInfo({ expiresAt: getQpqIsoDateTimeFromDate(new Date(Date.now() + 60 * 60 * 1000)) });

    renderHook(() => useRefreshTokens(info, refresh));

    vi.advanceTimersByTime(60 * 60 * 1000 - 10 * 60 * 1000);

    expect(refresh).toHaveBeenCalledWith(info);
  });

  it('refreshes immediately when already within the buffer window', () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const info = buildInfo({ expiresAt: getQpqIsoDateTimeFromDate(new Date(Date.now() + 60 * 1000)) });

    renderHook(() => useRefreshTokens(info, refresh));

    expect(refresh).toHaveBeenCalledWith(info);
  });

  it('does nothing without a refresh token or expiry', () => {
    const refresh = vi.fn();

    renderHook(() => useRefreshTokens(buildInfo({ refreshToken: undefined }), refresh));
    renderHook(() => useRefreshTokens(undefined, refresh));

    vi.advanceTimersByTime(60 * 60 * 1000);

    expect(refresh).not.toHaveBeenCalled();
  });

  it('clears the scheduled timeout on unmount', () => {
    const refresh = vi.fn().mockResolvedValue(undefined);
    const { unmount } = renderHook(() => useRefreshTokens(buildInfo({}), refresh));

    unmount();
    vi.advanceTimersByTime(60 * 60 * 1000);

    expect(refresh).not.toHaveBeenCalled();
  });
});
