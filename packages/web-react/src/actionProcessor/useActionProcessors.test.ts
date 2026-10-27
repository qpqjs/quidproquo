import { ActionProcessorListResolver } from 'quidproquo-core';

import { createElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { ActionProcessorContext } from './ActionProcessorContext';
import { useActionProcessors } from './useActionProcessors';

describe('useActionProcessors', () => {
  it('returns an empty resolver by default', async () => {
    const { result } = renderHook(() => useActionProcessors());

    expect(await result.current({} as any, {} as any)).toEqual({});
  });

  it('returns the resolver from the provider', async () => {
    const resolver: ActionProcessorListResolver = async () => ({ foo: (async () => [undefined]) as any });
    const wrapper = ({ children }: { children: ReactNode }) => createElement(ActionProcessorContext.Provider, { value: resolver }, children);

    const { result } = renderHook(() => useActionProcessors(), { wrapper });

    expect(Object.keys(await result.current({} as any, {} as any))).toEqual(['foo']);
  });
});
