import { createElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { BaseUrlContext } from '../BaseUrlContext';
import { BaseUrlResolvers } from '../types';
import { useBaseUrlResolvers } from './useBaseUrlResolvers';

describe('useBaseUrlResolvers', () => {
  it('returns the default empty resolvers without a provider', () => {
    const { result } = renderHook(() => useBaseUrlResolvers());

    expect(result.current.getApiUrl()).toBe('');
    expect(result.current.getWsUrl()).toBe('');
    expect(result.current.getMFManifestUrl()).toBe('');
  });

  it('returns the resolvers from the provider', () => {
    const resolvers: BaseUrlResolvers = {
      getApiUrl: () => 'https://api',
      getWsUrl: () => 'wss://ws',
      getMFManifestUrl: () => 'https://mf',
    };
    const wrapper = ({ children }: { children: ReactNode }) => createElement(BaseUrlContext.Provider, { value: resolvers }, children);

    const { result } = renderHook(() => useBaseUrlResolvers(), { wrapper });

    expect(result.current.getApiUrl()).toBe('https://api');
  });
});
