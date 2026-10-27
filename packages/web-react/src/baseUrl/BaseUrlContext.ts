import { createContext } from 'react';

import { BaseUrlResolvers } from './types';

export const BaseUrlContext = createContext<BaseUrlResolvers>({
  getApiUrl: () => '',
  getWsUrl: () => '',
  getMFManifestUrl: () => '',
});
