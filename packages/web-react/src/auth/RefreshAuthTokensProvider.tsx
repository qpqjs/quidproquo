import { AuthenticationInfo } from 'quidproquo-core';

import { memo } from 'react';

import { useRefreshTokens } from './hooks';

export type RefreshAuthTokensProviderProps = {
  children: React.ReactNode;
  authenticationInfo?: AuthenticationInfo;
  refreshTokens: (authenticationInfo: AuthenticationInfo) => Promise<any>;
  // Minutes before expiry to proactively refresh (default 10). Lower it for short-lived tokens.
  bufferMinutes?: number;
};

const RefreshAuthTokensProviderComponent: React.FC<RefreshAuthTokensProviderProps> = ({
  children,
  authenticationInfo,
  refreshTokens,
  bufferMinutes,
}) => {
  useRefreshTokens(authenticationInfo, refreshTokens, bufferMinutes);

  // This fragment is not useless!
  return <>{children}</>;
};

export const RefreshAuthTokensProvider = memo(RefreshAuthTokensProviderComponent);
