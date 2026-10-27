import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { FederationRuntimeApi } from './forceReloadFederatedRemote';

type FakeScriptTag = {
  getAttribute: (name: string) => string;
  remove: ReturnType<typeof vi.fn>;
};

type RegisteredPlugin = {
  name: string;
  createScript: (args: { url: string; remoteInfo?: { name: string } }) => { src: string } | undefined;
};

const REMOTE = { name: 'remoteA', alias: 'aliasA', entry: 'https://cdn.example.com/remoteA/remoteEntry.js' };

const makeScriptTag = (src: string): FakeScriptTag => ({
  getAttribute: () => src,
  remove: vi.fn(),
});

const makeRuntimeApi = (remotes: unknown[] = [REMOTE]) => {
  const registerRemotes = vi.fn();
  const registerPlugins = vi.fn();
  const getInstance = vi.fn(() => ({ options: { remotes } }));

  return { api: { getInstance, registerRemotes, registerPlugins } as FederationRuntimeApi, registerRemotes, registerPlugins };
};

let scriptTags: FakeScriptTag[];

// The module keeps per-remote reload state at module scope, so every test
// imports a fresh copy.
const importFreshModule = async () => {
  vi.resetModules();
  const { forceReloadFederatedRemote } = await import('./forceReloadFederatedRemote');
  return forceReloadFederatedRemote;
};

beforeEach(() => {
  scriptTags = [];
  vi.stubGlobal('document', {
    querySelectorAll: () => scriptTags,
    createElement: () => ({ src: '' }),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete (globalThis as Record<string, unknown>)[REMOTE.name];
  delete (globalThis as Record<string, unknown>)[`rspackChunk${REMOTE.name}`];
  delete (globalThis as Record<string, unknown>)[`webpackChunk${REMOTE.name}`];
});

describe('forceReloadFederatedRemote', () => {
  it('returns false with a warning when the remote is not registered', async () => {
    const forceReloadFederatedRemote = await importFreshModule();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { api, registerRemotes } = makeRuntimeApi([]);

    expect(forceReloadFederatedRemote(api, 'missingRemote', 1)).toBe(false);
    expect(warn).toHaveBeenCalledOnce();
    expect(registerRemotes).not.toHaveBeenCalled();
  });

  it('force re-registers the remote with a nonced entry url', async () => {
    const forceReloadFederatedRemote = await importFreshModule();
    const { api, registerRemotes } = makeRuntimeApi();

    expect(forceReloadFederatedRemote(api, 'remoteA', 7)).toBe(true);

    expect(registerRemotes).toHaveBeenCalledWith([{ ...REMOTE, entry: 'https://cdn.example.com/remoteA/remoteEntry.js?reload=7' }], { force: true });
  });

  it('resolves the remote by alias as well as name', async () => {
    const forceReloadFederatedRemote = await importFreshModule();
    const { api, registerRemotes } = makeRuntimeApi();

    expect(forceReloadFederatedRemote(api, 'aliasA', 7)).toBe(true);
    expect(registerRemotes).toHaveBeenCalledOnce();
  });

  it('clears the container and bundler chunk globals', async () => {
    const forceReloadFederatedRemote = await importFreshModule();
    const globals = globalThis as Record<string, unknown>;
    globals[REMOTE.name] = 'old-container';
    globals[`rspackChunk${REMOTE.name}`] = ['old-chunks'];
    globals[`webpackChunk${REMOTE.name}`] = ['old-chunks'];

    forceReloadFederatedRemote(makeRuntimeApi().api, 'remoteA', 1);

    expect(globals[REMOTE.name]).toBeUndefined();
    expect(globals[`rspackChunk${REMOTE.name}`]).toBeUndefined();
    expect(globals[`webpackChunk${REMOTE.name}`]).toBeUndefined();
  });

  it('removes only script tags under the remote entry directory', async () => {
    const forceReloadFederatedRemote = await importFreshModule();
    const remoteEntryTag = makeScriptTag('https://cdn.example.com/remoteA/remoteEntry.js?reload=1');
    const remoteChunkTag = makeScriptTag('https://cdn.example.com/remoteA/chunk.123.js');
    const unrelatedTag = makeScriptTag('https://cdn.example.com/other/app.js');
    scriptTags = [remoteEntryTag, remoteChunkTag, unrelatedTag];

    forceReloadFederatedRemote(makeRuntimeApi().api, 'remoteA', 2);

    expect(remoteEntryTag.remove).toHaveBeenCalledOnce();
    expect(remoteChunkTag.remove).toHaveBeenCalledOnce();
    expect(unrelatedTag.remove).not.toHaveBeenCalled();
  });

  it('registers the cache-bust plugin once across reloads', async () => {
    const forceReloadFederatedRemote = await importFreshModule();
    const { api, registerPlugins } = makeRuntimeApi();

    forceReloadFederatedRemote(api, 'remoteA', 1);
    forceReloadFederatedRemote(api, 'remoteA', 2);

    expect(registerPlugins).toHaveBeenCalledOnce();
  });

  it('serves nonced script urls for a reloading remote and leaves others alone', async () => {
    const forceReloadFederatedRemote = await importFreshModule();
    const { api, registerPlugins } = makeRuntimeApi();

    forceReloadFederatedRemote(api, 'remoteA', 9);
    const plugin: RegisteredPlugin = registerPlugins.mock.calls[0][0][0];

    const script = plugin.createScript({ url: 'https://cdn.example.com/remoteA/remoteEntry.js?reload=9', remoteInfo: { name: 'remoteA' } });
    expect(script?.src).toBe('https://cdn.example.com/remoteA/remoteEntry.js?reload=9');

    expect(plugin.createScript({ url: 'https://cdn.example.com/other/remoteEntry.js', remoteInfo: { name: 'otherRemote' } })).toBeUndefined();
    expect(plugin.createScript({ url: 'https://cdn.example.com/no-remote-info.js' })).toBeUndefined();
  });
});
