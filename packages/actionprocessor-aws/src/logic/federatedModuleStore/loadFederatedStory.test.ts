// Exercises the runtime loader against a file:// store using hand-written MF containers
// (the minimal {get, init} contract a real remoteEntry.js fulfils) - so the full flow
// (manifest -> sync -> require -> loadRemote -> story) runs without a webpack build.
// Covers: no store, empty store, happy path + cache, missing/unexposed runtime, missing
// exposes map, machine-independent (basePath-agnostic) advanced-runtime keys, and hot
// swap to a newly published version on a warm container.
import { QPQConfig } from 'quidproquo-core';

import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { loadFederatedStory, resetFederatedModuleStoreCache } from './loadFederatedStory';

// A minimal hand-written module federation container (the {get, init} contract the
// webpack-built remoteEntry.js fulfils) so the loader's whole store flow - manifest,
// version sync, disk require, MF runtime registration, expose lookup - runs for real
// without a webpack build.
const buildContainerSource = (containerName: string): string => `
  const modules = {
    './src/entry/hello': () => ({
      hello: async (name) => 'hello ' + name,
      farewell: async (name) => 'bye ' + name,
    }),
  };

  module.exports.${containerName} = {
    get: async (request) => {
      const factory = modules[request];
      if (!factory) {
        throw new Error('module not found: ' + request);
      }
      return () => factory();
    },
    init: async () => {},
  };
`;

const qpqConfig = [] as unknown as QPQConfig;

describe('loadFederatedStory', () => {
  let storeDir: string;
  let cacheDir: string;

  const publishFixtureStore = (containerName: string): void => {
    const hash = 'testhash1234';
    fs.mkdirSync(path.join(storeDir, hash), { recursive: true });
    fs.writeFileSync(path.join(storeDir, hash, 'remoteEntry.js'), buildContainerSource(containerName));
    fs.writeFileSync(
      path.join(storeDir, 'manifest.json'),
      JSON.stringify({
        containerName,
        service: 'testsvc',
        hash,
        entry: 'remoteEntry.js',
        files: ['remoteEntry.js'],
        exposes: { '/src/entry/hello::hello': 'src/entry/hello', '/src/entry/hello::farewell': 'src/entry/hello' },
      }),
    );
  };

  beforeEach(() => {
    storeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-fed-store-'));
    cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-fed-cache-'));
    process.env.federatedCodeStoreUrl = `file://${storeDir}`;
    process.env.federatedCodeStoreCacheDir = cacheDir;
    resetFederatedModuleStoreCache();
  });

  afterEach(() => {
    delete process.env.federatedCodeStoreUrl;
    delete process.env.federatedCodeStoreCacheDir;
    fs.rmSync(storeDir, { recursive: true, force: true });
    fs.rmSync(cacheDir, { recursive: true, force: true });
  });

  it('returns undefined when no store url is configured', async () => {
    delete process.env.federatedCodeStoreUrl;

    expect(await loadFederatedStory(qpqConfig, '/src/entry/hello::hello')).toBeUndefined();
  });

  it('returns undefined when the store has no manifest published', async () => {
    expect(await loadFederatedStory(qpqConfig, '/src/entry/hello::hello')).toBeUndefined();
  });

  it('loads a story from a published container and caches the version dir', async () => {
    publishFixtureStore('qpq_testsvc');

    const story = await loadFederatedStory<(name: string) => Promise<string>>(qpqConfig, '/src/entry/hello::hello');

    expect(story).toBeTypeOf('function');
    expect(await story!('lambda')).toBe('hello lambda');

    // Synced into the cache dir under container/hash
    expect(fs.existsSync(path.join(cacheDir, 'qpq_testsvc', 'testhash1234', 'remoteEntry.js'))).toBe(true);

    // A second story from the same exposed module resolves via its export name
    const farewell = await loadFederatedStory<(name: string) => Promise<string>>(qpqConfig, '/src/entry/hello::farewell');
    expect(await farewell!('lambda')).toBe('bye lambda');
  });

  it('returns undefined for a runtime the manifest does not expose', async () => {
    publishFixtureStore('qpq_testsvc2');

    expect(await loadFederatedStory(qpqConfig, '/src/entry/unknown::nope')).toBeUndefined();
  });

  it('returns undefined when the story is not exported from the federated module', async () => {
    publishFixtureStore('qpq_testsvc3');

    // Manifest exposes the file, but the container module has no such export
    const manifest = JSON.parse(fs.readFileSync(path.join(storeDir, 'manifest.json'), 'utf8'));
    manifest.exposes['/src/entry/hello::missing'] = 'src/entry/hello';
    fs.writeFileSync(path.join(storeDir, 'manifest.json'), JSON.stringify(manifest));

    expect(await loadFederatedStory(qpqConfig, '/src/entry/hello::missing')).toBeUndefined();
  });

  it('returns undefined without crashing when the manifest omits the exposes map', async () => {
    const hash = 'noexposes123';
    fs.mkdirSync(path.join(storeDir, hash), { recursive: true });
    fs.writeFileSync(path.join(storeDir, hash, 'remoteEntry.js'), buildContainerSource('qpq_noexposes'));
    // exposes intentionally missing - must be rejected as invalid, not crash on deref
    fs.writeFileSync(
      path.join(storeDir, 'manifest.json'),
      JSON.stringify({ containerName: 'qpq_noexposes', service: 'svc', hash, entry: 'remoteEntry.js', files: ['remoteEntry.js'] }),
    );

    expect(await loadFederatedStory(qpqConfig, '/src/entry/hello::hello')).toBeUndefined();
  });

  it('matches an advanced runtime by its machine-independent key, ignoring basePath', async () => {
    const hash = 'advkey123';
    fs.mkdirSync(path.join(storeDir, hash), { recursive: true });
    // Container exposes 'svc/entry/hello'; MF requests it as './svc/entry/hello'
    const src = `
      const modules = { './svc/entry/hello': () => ({ hello: async (n) => 'hi ' + n }) };
      module.exports.qpq_adv = {
        get: async (request) => { const factory = modules[request]; if (!factory) { throw new Error('not found: ' + request); } return () => factory(); },
        init: async () => {},
      };
    `;
    fs.writeFileSync(path.join(storeDir, hash, 'remoteEntry.js'), src);
    fs.writeFileSync(
      path.join(storeDir, 'manifest.json'),
      JSON.stringify({
        containerName: 'qpq_adv',
        service: 'svc',
        hash,
        entry: 'remoteEntry.js',
        files: ['remoteEntry.js'],
        exposes: { 'svc/entry/hello::hello': 'svc/entry/hello' },
      }),
    );

    // basePath is a path this machine never built at - the lookup must still match
    const runtime = { basePath: '/completely/different/machine/path', relativePath: 'svc/entry/hello', functionName: 'hello' };
    const story = await loadFederatedStory<(name: string) => Promise<string>>(qpqConfig, runtime as any);

    expect(story).toBeTypeOf('function');
    expect(await story!('there')).toBe('hi there');
  });

  it('picks up a newly published version on a warm container (hot swap)', async () => {
    // recheckMs=0 makes the loader re-probe the manifest on every resolve.
    process.env.federatedCodeStoreRecheckMs = '0';

    const publishVersion = (hash: string, tag: string) => {
      fs.mkdirSync(path.join(storeDir, hash), { recursive: true });
      const src = `
        const modules = { './entry': () => ({ run: async () => '${tag}' }) };
        module.exports.qpq_swap = {
          get: async (request) => { const factory = modules[request]; if (!factory) { throw new Error('nf ' + request); } return () => factory(); },
          init: async () => {},
        };
      `;
      fs.writeFileSync(path.join(storeDir, hash, 'remoteEntry.js'), src);
      fs.writeFileSync(
        path.join(storeDir, 'manifest.json'),
        JSON.stringify({
          containerName: 'qpq_swap',
          service: 'svc',
          hash,
          entry: 'remoteEntry.js',
          files: ['remoteEntry.js'],
          exposes: { '/entry::run': 'entry' },
        }),
      );
    };

    try {
      publishVersion('v1hash', 'VERSION_1');
      const v1 = await loadFederatedStory<() => Promise<string>>(qpqConfig, '/entry::run');
      expect(await v1!()).toBe('VERSION_1');

      // Publish a NEW version (new hash) into the same store - no redeploy.
      publishVersion('v2hash', 'VERSION_2');

      // The warm loader re-probes and hot-swaps; the background refresh lands within a
      // couple of calls (this is what makes a redeploy-free code change visible).
      let latest = 'VERSION_1';
      for (let i = 0; i < 20 && latest !== 'VERSION_2'; i++) {
        const story = await loadFederatedStory<() => Promise<string>>(qpqConfig, '/entry::run');
        latest = await story!();
        if (latest !== 'VERSION_2') {
          // A real (macrotask) delay: the background probe needs several event-loop
          // turns of fs promises to land; setImmediate spins can outrun it.
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }

      expect(latest).toBe('VERSION_2');
    } finally {
      delete process.env.federatedCodeStoreRecheckMs;
    }
  });
});
