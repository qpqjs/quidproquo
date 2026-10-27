import { AskResponse, askStateDispatch, askStateRead, Story } from 'quidproquo-core';

import { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';

import { createQpqStore, QpqStore } from '../store/createQpqStore';
import { qpqStoreContext } from '../store/qpqStoreContext';
import { BubbleReducerDispatchContext } from './BubbleReducerDispatchContext';
import { createQpqRuntimeDefinition } from './createQpqRuntimeDefinition';
import { useQpqRuntime } from './useQpqRuntime';

type State = { count: number };
type Action = { type: 'inc' };

const reducer = (state: State, action: Action): [State, boolean] => (action.type === 'inc' ? [{ count: state.count + 1 }, true] : [state, false]);

function* askReadCount(): AskResponse<State> {
  return yield* askStateRead<State>();
}

function* askIncrement(): AskResponse<void> {
  yield* askStateDispatch({ type: 'inc' });
}

const api = { askReadCount };

const buildDefinition = (uniqueName: string, onInit?: Story<any, any>) =>
  createQpqRuntimeDefinition<State, Action, typeof api>({ uniqueName, api, initialState: { count: 0 }, reducer, onInit });

const buildWrapper = (store: QpqStore) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <qpqStoreContext.Provider value={store}>{children}</qpqStoreContext.Provider>;
  };

describe('useQpqRuntime', () => {
  it('exposes the api with the ask prefix removed and lower-cased', async () => {
    const definition = buildDefinition('read');
    const { result } = renderHook(() => useQpqRuntime(definition), { wrapper: buildWrapper(createQpqStore()) });

    const [mappedApi] = result.current;
    expect(typeof (mappedApi as any).readCount).toBe('function');

    await expect((mappedApi as any).readCount()).resolves.toEqual({ count: 0 });
  });

  it('dispatches handled actions into the store, visible to every binder of the area', async () => {
    const definition = buildDefinition('dispatch');
    const { result } = renderHook(
      () => {
        const a = useQpqRuntime(definition);
        const b = useQpqRuntime(definition);
        return { a, b };
      },
      { wrapper: buildWrapper(createQpqStore()) },
    );

    act(() => result.current.a[2]({ type: 'inc' }));

    await waitFor(() => expect(result.current.a[1]).toEqual({ count: 1 }));
    expect(result.current.b[1]).toEqual({ count: 1 });
  });

  it('keeps areas with different instance names isolated', async () => {
    const definition = buildDefinition('profile');
    const { result } = renderHook(
      () => {
        const a = useQpqRuntime(definition, '1234');
        const b = useQpqRuntime(definition, '2222');
        return { a, b };
      },
      { wrapper: buildWrapper(createQpqStore()) },
    );

    act(() => result.current.a[2]({ type: 'inc' }));

    await waitFor(() => expect(result.current.a[1]).toEqual({ count: 1 }));
    expect(result.current.b[1]).toEqual({ count: 0 });
  });

  it('runs onInit once per area, no matter how many components bind', async () => {
    let initRuns = 0;
    function* askInit(): AskResponse<void> {
      initRuns += 1;
      yield* askStateDispatch({ type: 'inc' });
    }

    const definition = buildDefinition('boot', askInit);
    const { result } = renderHook(
      () => {
        const a = useQpqRuntime(definition);
        const b = useQpqRuntime(definition);
        return { a, b };
      },
      { wrapper: buildWrapper(createQpqStore()) },
    );

    await waitFor(() => expect(result.current.a[1]).toEqual({ count: 1 }));
    expect(initRuns).toBe(1);
  });

  it('releases the area when the last binder unmounts and re-inits on rebind', async () => {
    let initRuns = 0;
    function* askInit(): AskResponse<void> {
      initRuns += 1;
    }

    const store = createQpqStore();
    const definition = buildDefinition('session', askInit);
    const wrapper = buildWrapper(store);

    const first = renderHook(() => useQpqRuntime(definition), { wrapper });
    await waitFor(() => expect(initRuns).toBe(1));
    expect(store.hasArea('session')).toBe(true);

    first.unmount();
    expect(store.hasArea('session')).toBe(false);

    const second = renderHook(() => useQpqRuntime(definition), { wrapper });
    await waitFor(() => expect(initRuns).toBe(2));
    expect(store.hasArea('session')).toBe(true);
    second.unmount();
  });

  it('skips onInit while the store is frozen (devtools time travel)', async () => {
    let initRuns = 0;
    function* askInit(): AskResponse<void> {
      initRuns += 1;
    }

    const store = createQpqStore();
    store.freeze();
    const definition = buildDefinition('frozen-init', askInit);

    renderHook(() => useQpqRuntime(definition), { wrapper: buildWrapper(store) });

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(initRuns).toBe(0);
  });

  it('bubbles unhandled actions to the parent dispatch', () => {
    const parentDispatch = vi.fn();
    const store = createQpqStore();
    const definition = buildDefinition('bubble');

    const wrapper = ({ children }: { children: ReactNode }) => (
      <qpqStoreContext.Provider value={store}>
        <BubbleReducerDispatchContext.Provider value={parentDispatch}>{children}</BubbleReducerDispatchContext.Provider>
      </qpqStoreContext.Provider>
    );

    const { result } = renderHook(() => useQpqRuntime(definition), { wrapper });

    act(() => result.current[2]({ type: 'unknown' } as any));

    expect(parentDispatch).toHaveBeenCalledWith({ type: 'unknown' });
  });

  it('runs the main story through askIncrement when invoked via the mapped api', async () => {
    const definition = createQpqRuntimeDefinition<State, Action, { askIncrement: typeof askIncrement }>({
      uniqueName: 'api-dispatch',
      api: { askIncrement },
      initialState: { count: 0 },
      reducer,
    });

    const { result } = renderHook(() => useQpqRuntime(definition), { wrapper: buildWrapper(createQpqStore()) });

    await act(async () => {
      await (result.current[0] as any).increment();
    });

    await waitFor(() => expect(result.current[1]).toEqual({ count: 1 }));
  });
});
