import { AuthenticationInfo } from 'quidproquo-core';

import { useEffect } from 'react';

import { useFastCallback } from '../../hooks/useFastCallback';

// How many minutes before a token expires to proactively refresh it. Must be shorter than
// the token's lifetime, or `refreshTime` is always negative and every render refreshes
// immediately (a loop). Apps with short-lived tokens should lower this.
const DEFAULT_REFRESH_BUFFER_MINUTES = 10;

export const useRefreshTokens = (
  authenticationInfo: AuthenticationInfo | undefined,
  refreshTokens: (authenticationInfo: AuthenticationInfo) => Promise<any>,
  bufferMinutes: number = DEFAULT_REFRESH_BUFFER_MINUTES,
) => {
  const stableRefreshTokens = useFastCallback(refreshTokens);

  // Stable identity so the effect below can list it as a dependency without
  // re-running on every render.
  const refresh = useFastCallback(() => {
    if (authenticationInfo && authenticationInfo.refreshToken && authenticationInfo.expiresAt) {
      const now = new Date().toISOString();
      const timeToExpire = new Date(authenticationInfo.expiresAt).getTime() - new Date(now).getTime();

      // Refresh `bufferMinutes` before expiry so there's margin for the refresh round-trip.
      const bufferTime = bufferMinutes * 60 * 1000;
      const refreshTime = timeToExpire - bufferTime;

      if (refreshTime > 0) {
        return setTimeout(() => {
          stableRefreshTokens(authenticationInfo);
        }, refreshTime);
      } else {
        // If the token is already expired or very close to expiration, refresh immediately
        stableRefreshTokens(authenticationInfo);
      }
    }

    return null;
  });

  useEffect(() => {
    const timerId = refresh();

    return () => {
      // Cleanup on unmount or when authState changes
      if (timerId) {
        clearTimeout(timerId);
      }
    };
    // Key on the stable primitives that actually drive a refresh, not the
    // authenticationInfo object itself. Callers commonly derive that object
    // fresh on every render (e.g. an unmemoized selector), so depending on its
    // reference would re-run this effect every render — and when the token is
    // expired/near-expiry the "refresh immediately" branch would then fire a
    // network refresh on every render, an unbounded loop.
  }, [refresh, authenticationInfo?.expiresAt, authenticationInfo?.refreshToken, bufferMinutes]);
};
