import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createQpqStore } from './createQpqStore';

describe('createQpqStore', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('seeds initial state on the first bind only', () => {
    const store = createQpqStore();

    expect(store.bindArea('a', { count: 0 })).toBe(true);
    expect(store.bindArea('a', { count: 99 })).toBe(false);

    expect(store.getAreaState('a')).toEqual({ count: 0 });
  });

  it('deletes state when the last bind is released', () => {
    const store = createQpqStore();

    store.bindArea('a', { count: 0 });
    store.bindArea('a', { count: 0 });

    store.unbindArea('a');
    expect(store.hasArea('a')).toBe(true);

    store.unbindArea('a');
    expect(store.hasArea('a')).toBe(false);
  });

  it('re-seeds and reports first bind after an area was released', () => {
    const store = createQpqStore();

    store.bindArea('a', { count: 0 });
    store.setAreaState('a', { count: 5 });
    store.unbindArea('a');

    expect(store.bindArea('a', { count: 0 })).toBe(true);
    expect(store.getAreaState('a')).toEqual({ count: 0 });
  });

  it('updates state and notifies subscribers of that area only', () => {
    const store = createQpqStore();
    const listenerA = vi.fn();
    const listenerB = vi.fn();

    store.bindArea('a', 0);
    store.bindArea('b', 0);
    store.subscribe('a', listenerA);
    store.subscribe('b', listenerB);

    store.setAreaState('a', 1);

    expect(store.getAreaState('a')).toBe(1);
    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).not.toHaveBeenCalled();
  });

  it('drops writes to unbound areas with a warning', () => {
    const store = createQpqStore();
    const listener = vi.fn();

    store.subscribe('ghost', listener);
    store.setAreaState('ghost', { count: 1 });

    expect(store.hasArea('ghost')).toBe(false);
    expect(listener).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith('qpq store: dropped set_state for unbound area "ghost"');
  });

  it('notifies existing subscribers when a bind re-seeds an area', () => {
    const store = createQpqStore();
    const listener = vi.fn();

    store.subscribe('a', listener);
    store.bindArea('a', { count: 0 });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('unsubscribing does not detach listeners registered after the set emptied', () => {
    const store = createQpqStore();
    const early = vi.fn();
    const late = vi.fn();

    store.bindArea('a', 0);
    const unsubscribeEarly = store.subscribe('a', early);
    unsubscribeEarly();

    store.subscribe('a', late);
    unsubscribeEarly();

    store.setAreaState('a', 1);
    expect(late).toHaveBeenCalledTimes(1);
  });

  it('unbinding an area that was never bound is a no-op', () => {
    const store = createQpqStore();

    store.unbindArea('missing');

    expect(store.hasArea('missing')).toBe(false);
  });

  it('getSnapshot returns the entire state as one object, one key per bound area', () => {
    const store = createQpqStore();

    store.bindArea('auth/login', { user: 'joe' });
    store.bindArea('shell/tabLayout', { tabs: [] });
    store.setAreaState('shell/tabLayout', { tabs: ['a'] });

    expect(store.getSnapshot()).toEqual({
      'auth/login': { user: 'joe' },
      'shell/tabLayout': { tabs: ['a'] },
    });

    store.unbindArea('auth/login');
    expect(store.getSnapshot()).toEqual({ 'shell/tabLayout': { tabs: ['a'] } });
  });

  it('while frozen, live writes drop and releases defer; thaw sweeps and emits release', () => {
    const store = createQpqStore();
    const events: unknown[] = [];
    store.bindArea('a', { v: 1 });
    store.subscribeToStore((event) => events.push(event));

    store.freeze();

    store.setAreaState('a', { v: 2 });
    expect(store.getAreaState('a')).toEqual({ v: 1 });

    store.unbindArea('a');
    expect(store.hasArea('a')).toBe(true);
    expect(events).toEqual([]);

    store.thaw();
    expect(store.hasArea('a')).toBe(false);
    expect(events).toEqual([{ type: 'release', areaKey: 'a' }]);
  });

  it('restoreAreaState writes bound areas anytime and resurrects unbound areas only while frozen', () => {
    const store = createQpqStore();
    store.bindArea('a', 1);

    store.restoreAreaState('a', 2);
    expect(store.getAreaState('a')).toBe(2);

    store.restoreAreaState('ghost', 9);
    expect(store.hasArea('ghost')).toBe(false);

    store.freeze();
    store.restoreAreaState('ghost', 9);
    expect(store.getAreaState('ghost')).toBe(9);

    // Rebinding the resurrection keeps its state alive past the thaw sweep.
    expect(store.bindArea('ghost', 0)).toBe(false);
    store.thaw();
    expect(store.getAreaState('ghost')).toBe(9);
  });

  it('subscribeToStore hears seed, set_state and release events', () => {
    const store = createQpqStore();
    const events: unknown[] = [];
    const unsubscribe = store.subscribeToStore((event) => events.push(event));

    store.bindArea('a', 0);
    store.bindArea('a', 0);
    store.setAreaState('a', 1);
    store.unbindArea('a');
    store.unbindArea('a');

    expect(events).toEqual([
      { type: 'seed', areaKey: 'a' },
      { type: 'set_state', areaKey: 'a' },
      { type: 'release', areaKey: 'a' },
    ]);

    unsubscribe();
    store.bindArea('b', 0);
    expect(events).toHaveLength(3);
  });
});
