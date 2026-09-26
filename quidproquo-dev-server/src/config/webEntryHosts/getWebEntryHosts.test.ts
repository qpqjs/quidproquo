import { buildTestQpqConfig } from 'quidproquo-core';
import { defineWebEntry } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { defineDevServerOptions } from '../settings/defineDevServerOptions';
import { getWebEntryHosts } from './getWebEntryHosts';

const domain = { onRootDomain: true };

const shell = buildTestQpqConfig(
  [
    defineWebEntry('website', { domain, buildPath: './website' }),
    defineWebEntry('docs', { domain, buildPath: '../docs/build' }),
    defineDevServerOptions({ views: { port: 3080 }, webEntries: { docs: { port: 3090 } } }),
  ],
  { moduleName: 'shell', configRoot: '/repo/shell' },
);

describe('getWebEntryHosts', () => {
  it('pairs each listed web entry with its setting and config root', () => {
    const [docs] = getWebEntryHosts([shell]);

    expect(getWebEntryHosts([shell])).toHaveLength(1);
    expect(docs.service).toBe('shell');
    expect(docs.entryName).toBe('docs');
    expect(docs.port).toBe(3090);
    expect(docs.webEntry.buildPath).toBe('../docs/build');
    expect(docs.configRoot).toBe('/repo/shell');
  });

  it('skips services with nothing listed', () => {
    const admin = buildTestQpqConfig([defineDevServerOptions({ views: { port: 3082 } })], { moduleName: 'admin' });

    expect(getWebEntryHosts([admin])).toEqual([]);
  });

  it('throws when a listed name has no defineWebEntry', () => {
    const broken = buildTestQpqConfig([defineDevServerOptions({ webEntries: { docs: { port: 3090 } } })], { moduleName: 'shell' });

    expect(() => getWebEntryHosts([broken])).toThrow(
      "[shell] defineDevServerOptions lists webEntries.docs, but the service has no defineWebEntry('docs')",
    );
  });

  it('throws when two entries share a port', () => {
    const other = buildTestQpqConfig([defineWebEntry('help', { domain }), defineDevServerOptions({ webEntries: { help: { port: 3090 } } })], {
      moduleName: 'support',
    });

    expect(() => getWebEntryHosts([shell, other])).toThrow('Web entries shell/docs and support/help both use port 3090');
  });

  it('throws when an entry takes a reserved port', () => {
    expect(() => getWebEntryHosts([shell], [3090])).toThrow('Web entry shell/docs uses port 3090, which the dev server already listens on');
  });
});
