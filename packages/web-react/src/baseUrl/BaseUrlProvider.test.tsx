import { createElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { BaseUrlProvider } from './BaseUrlProvider';
import { useBaseUrlResolvers } from './hooks';
import { BaseUrlResolvers } from './types';

describe('BaseUrlProvider', () => {
  it('provides the resolvers to descendants', () => {
    const urlResolvers: BaseUrlResolvers = {
      getApiUrl: () => 'https://api',
      getWsUrl: () => 'wss://ws',
      getMFManifestUrl: () => 'https://mf',
    };
    const wrapper = ({ children }: { children: ReactNode }) => createElement(BaseUrlProvider, { urlResolvers }, children);

    const { result } = renderHook(() => useBaseUrlResolvers(), { wrapper });

    expect(result.current.getApiUrl()).toBe('https://api');
  });
});
