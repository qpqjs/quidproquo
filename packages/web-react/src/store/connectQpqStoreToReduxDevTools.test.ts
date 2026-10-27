import { afterEach, describe, expect, it, vi } from 'vitest';

import { connectQpqStoreToReduxDevTools } from './connectQpqStoreToReduxDevTools';
import { createQpqStore } from './createQpqStore';

type FakeMessage = { type: string; payload?: { type?: string; actionId?: number; status?: boolean }; state?: string };

const installFakeExtension = () => {
  const sent: Array<{ action: { type: string }; state: unknown }> = [];
  let messageListener: ((message: FakeMessage) => void) | undefined;

  const connection = {
    initState: undefined as unknown,
    init(state: unknown) {
      this.initState = state;
    },
    send(action: { type: string }, state: unknown) {
      sent.push({ action, state });
    },
    subscribe(listener: (message: FakeMessage) => void) {
      messageListener = listener;
      return () => {
        messageListener = undefined;
      };
    },
  };

  (globalThis as any).__REDUX_DEVTOOLS_EXTENSION__ = {
    connect: vi.fn(() => connection),
  };

  return {
    connection,
    sent,
    dispatchFromDevTools: (message: FakeMessage) => messageListener?.(message),
  };
};

const jumpTo = (actionId: number, state: Record<string, unknown>): FakeMessage => ({
  type: 'DISPATCH',
  payload: { type: 'JUMP_TO_ACTION', actionId },
  state: JSON.stringify(state),
});

describe('connectQpqStoreToReduxDevTools', () => {
  afterEach(() => {
    delete (globalThis as any).__REDUX_DEVTOOLS_EXTENSION__;
  });

  it('is a noop without the extension', () => {
    const store = createQpqStore();

    const disconnect = connectQpqStoreToReduxDevTools(store);
    store.bindArea('a', 0);

    expect(typeof disconnect).toBe('function');
    disconnect();
  });

  it('inits with the current snapshot and sends named actions with full state', () => {
    const { connection, sent } = installFakeExtension();
    const store = createQpqStore();
    store.bindArea('auth/login', { user: null });

    const disconnect = connectQpqStoreToReduxDevTools(store, 'test-app');

    expect(connection.initState).toEqual({ 'auth/login': { user: null } });

    store.setAreaState('auth/login', { user: 'joe' });
    expect(sent).toEqual([{ action: { type: 'set_state: auth/login' }, state: { 'auth/login': { user: 'joe' } } }]);

    store.unbindArea('auth/login');
    expect(sent[1]).toEqual({ action: { type: 'release: auth/login' }, state: {} });

    disconnect();
    store.bindArea('b', 0);
    expect(sent).toHaveLength(2);
  });

  it('jumping away freezes: state restores, live writes drop, releases defer, log stays put', () => {
    const { sent, dispatchFromDevTools } = installFakeExtension();
    const store = createQpqStore();
    store.bindArea('a', 0);
    connectQpqStoreToReduxDevTools(store);

    store.setAreaState('a', 1);
    store.setAreaState('a', 2);
    const sendsBeforeJump = sent.length;

    dispatchFromDevTools(jumpTo(1, { a: 1 }));

    expect(store.isFrozen()).toBe(true);
    expect(store.getAreaState('a')).toBe(1);

    store.setAreaState('a', 99);
    expect(store.getAreaState('a')).toBe(1);

    store.unbindArea('a');
    expect(store.hasArea('a')).toBe(true);

    expect(sent).toHaveLength(sendsBeforeJump);
  });

  it('jumping back to the newest action thaws and sweeps unbound areas', () => {
    const { sent, dispatchFromDevTools } = installFakeExtension();
    const store = createQpqStore();
    store.bindArea('a', 0);
    connectQpqStoreToReduxDevTools(store);

    store.setAreaState('a', 1);
    store.setAreaState('a', 2);

    dispatchFromDevTools(jumpTo(1, { a: 1 }));
    store.unbindArea('a');

    dispatchFromDevTools(jumpTo(2, { a: 2 }));

    expect(store.isFrozen()).toBe(false);
    expect(store.hasArea('a')).toBe(false);
    expect(sent[sent.length - 1]?.action.type).toBe('release: a');
  });

  it('jumping into the past resurrects released areas so pop-ins render history instead of fetching', () => {
    const { dispatchFromDevTools } = installFakeExtension();
    const store = createQpqStore();
    store.bindArea('live', { v: 0 });
    connectQpqStoreToReduxDevTools(store);

    store.setAreaState('live', { v: 1 });

    dispatchFromDevTools(jumpTo(0, { live: { v: 0 }, ghost: { user: 'old' } }));

    expect(store.hasArea('ghost')).toBe(true);
    expect(store.getAreaState('ghost')).toEqual({ user: 'old' });

    // A component popping in binds the resurrection: NOT a first bind, so no
    // seed and (at the hook level) no onInit.
    expect(store.bindArea('ghost', { user: null })).toBe(false);
    expect(store.getAreaState('ghost')).toEqual({ user: 'old' });

    // Areas absent from the jumped snapshot keep their present state.
    expect(store.getAreaState('live')).toEqual({ v: 0 });
  });

  it('notifies area subscribers when a jump lands so bound components re-render', () => {
    const { dispatchFromDevTools } = installFakeExtension();
    const store = createQpqStore();
    store.bindArea('a', 0);
    connectQpqStoreToReduxDevTools(store);

    const listener = vi.fn();
    store.subscribe('a', listener);

    dispatchFromDevTools({ type: 'DISPATCH', payload: { type: 'JUMP_TO_STATE' }, state: JSON.stringify({ a: 5 }) });

    expect(store.getAreaState('a')).toBe(5);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('the lock button is a manual freeze', () => {
    const { dispatchFromDevTools } = installFakeExtension();
    const store = createQpqStore();
    store.bindArea('a', 0);
    connectQpqStoreToReduxDevTools(store);

    dispatchFromDevTools({ type: 'DISPATCH', payload: { type: 'LOCK_CHANGES', status: true } });
    expect(store.isFrozen()).toBe(true);
    store.setAreaState('a', 1);
    expect(store.getAreaState('a')).toBe(0);

    dispatchFromDevTools({ type: 'DISPATCH', payload: { type: 'LOCK_CHANGES', status: false } });
    expect(store.isFrozen()).toBe(false);
    store.setAreaState('a', 1);
    expect(store.getAreaState('a')).toBe(1);
  });

  it('commit while jumped adopts the on-screen past as the new present', () => {
    const { connection, dispatchFromDevTools } = installFakeExtension();
    const store = createQpqStore();
    store.bindArea('a', 0);
    connectQpqStoreToReduxDevTools(store);

    store.setAreaState('a', 1);
    store.setAreaState('a', 2);
    dispatchFromDevTools(jumpTo(1, { a: 1 }));

    dispatchFromDevTools({ type: 'DISPATCH', payload: { type: 'COMMIT' } });

    expect(store.isFrozen()).toBe(false);
    expect(store.getAreaState('a')).toBe(1);
    expect(connection.initState).toEqual({ a: 1 });
  });

  it('reset returns to the committed baseline and thaws', () => {
    const { dispatchFromDevTools } = installFakeExtension();
    const store = createQpqStore();
    store.bindArea('a', 0);
    connectQpqStoreToReduxDevTools(store);

    store.setAreaState('a', 1);
    dispatchFromDevTools({ type: 'DISPATCH', payload: { type: 'COMMIT' } });

    store.setAreaState('a', 2);
    dispatchFromDevTools({ type: 'DISPATCH', payload: { type: 'RESET' } });

    expect(store.getAreaState('a')).toBe(1);
    expect(store.isFrozen()).toBe(false);
  });

  it('createQpqStore connects itself when given a devToolsName, and not otherwise', () => {
    const fake = installFakeExtension();

    createQpqStore();
    expect((globalThis as any).__REDUX_DEVTOOLS_EXTENSION__.connect).not.toHaveBeenCalled();

    const store = createQpqStore({ devToolsName: 'my-app' });
    expect((globalThis as any).__REDUX_DEVTOOLS_EXTENSION__.connect).toHaveBeenCalledWith({ name: 'my-app', features: expect.any(Object) });

    store.bindArea('a', 0);
    expect(fake.sent[0]?.action.type).toBe('seed: a');
  });

  it('ignores unparsable time-travel state without freezing', () => {
    const { dispatchFromDevTools } = installFakeExtension();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const store = createQpqStore();
    store.bindArea('a', 0);
    connectQpqStoreToReduxDevTools(store);

    dispatchFromDevTools({ type: 'DISPATCH', payload: { type: 'JUMP_TO_ACTION', actionId: 0 }, state: 'not-json' });

    expect(store.getAreaState('a')).toBe(0);
    expect(store.isFrozen()).toBe(false);
    warn.mockRestore();
  });
});
