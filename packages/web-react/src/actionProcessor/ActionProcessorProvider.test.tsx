import { ActionProcessorListResolver } from 'quidproquo-core';

import { createElement, ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';

import { ActionProcessorProvider } from './ActionProcessorProvider';
import { useActionProcessors } from './useActionProcessors';

describe('ActionProcessorProvider', () => {
  it('exposes its processors to descendants', async () => {
    const getActionProcessors: ActionProcessorListResolver = async () => ({ own: (async () => [undefined]) as any });
    const wrapper = ({ children }: { children: ReactNode }) => createElement(ActionProcessorProvider, { getActionProcessors }, children);

    const { result } = renderHook(() => useActionProcessors(), { wrapper });

    expect(Object.keys(await result.current({} as any, {} as any))).toEqual(['own']);
  });

  it('merges parent and child processors, child winning on collision', async () => {
    const parent: ActionProcessorListResolver = async () => ({ a: (async () => ['parent']) as any, shared: (async () => ['parent']) as any });
    const child: ActionProcessorListResolver = async () => ({ b: (async () => ['child']) as any, shared: (async () => ['child']) as any });

    const wrapper = ({ children }: { children: ReactNode }) =>
      createElement(
        ActionProcessorProvider,
        { getActionProcessors: parent },
        createElement(ActionProcessorProvider, { getActionProcessors: child }, children),
      );

    const { result } = renderHook(() => useActionProcessors(), { wrapper });
    const processors = await result.current({} as any, {} as any);

    expect(Object.keys(processors).sort()).toEqual(['a', 'b', 'shared']);
    expect(await processors.shared({} as any, {} as any, {} as any, {} as any, {} as any, {} as any, {} as any)).toEqual(['child']);
  });
});
