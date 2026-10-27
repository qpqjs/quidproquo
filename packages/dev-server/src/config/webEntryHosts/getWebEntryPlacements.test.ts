import { buildTestQpqConfig } from 'quidproquo-core';
import { defineWebEntry } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { defineDevServerOptions } from '../settings/defineDevServerOptions';
import { getWebEntryPlacements } from './getWebEntryPlacements';

const root = { onRootDomain: true };
const sub = (subDomainName: string) => ({ onRootDomain: true, subDomainName });

const shell = buildTestQpqConfig(
  [
    defineWebEntry('views', { domain: sub('views'), buildPath: './views' }),
    defineWebEntry('website', { domain: root, buildPath: './website' }),
    defineWebEntry('docs', { domain: sub('docs'), buildPath: '../docs/build' }),
    defineDevServerOptions({ views: { port: 3080 }, webEntries: { docs: { port: 3090 } } }),
  ],
  { moduleName: 'shell', configRoot: '/repo/shell' },
);

describe('getWebEntryPlacements', () => {
  it('hosts ported entries and routes the rest by domain, root last', () => {
    const { hosts, routes } = getWebEntryPlacements([shell]);

    expect(hosts.map((host) => [host.entryName, host.port])).toEqual([['docs', 3090]]);
    expect(hosts[0].webEntry.buildPath).toBe('../docs/build');
    expect(hosts[0].configRoot).toBe('/repo/shell');

    expect(routes.map((route) => [route.entryName, route.path])).toEqual([
      ['views', '/views'],
      ['website', '/'],
    ]);
  });

  it('places nothing for a service with no web entries', () => {
    const admin = buildTestQpqConfig([defineDevServerOptions({ views: { port: 3082 } })], { moduleName: 'admin' });

    expect(getWebEntryPlacements([admin])).toEqual({ hosts: [], routes: [] });
  });

  it('throws when a listed name has no defineWebEntry', () => {
    const broken = buildTestQpqConfig([defineDevServerOptions({ webEntries: { docs: { port: 3090 } } })], { moduleName: 'shell' });

    expect(() => getWebEntryPlacements([broken])).toThrow(
      "[shell] defineDevServerOptions lists webEntries.docs, but the service has no defineWebEntry('docs')",
    );
  });

  it('throws when two entries share a port', () => {
    const other = buildTestQpqConfig(
      [defineWebEntry('help', { domain: sub('help') }), defineDevServerOptions({ webEntries: { help: { port: 3090 } } })],
      {
        moduleName: 'support',
      },
    );

    expect(() => getWebEntryPlacements([shell, other])).toThrow('Web entries shell/docs and support/help both use port 3090');
  });

  it('throws when an entry takes a reserved port', () => {
    expect(() => getWebEntryPlacements([shell], [3090])).toThrow('Web entry shell/docs uses port 3090, which the dev server already listens on');
  });

  it('throws when two services both claim the root domain', () => {
    const other = buildTestQpqConfig([defineWebEntry('site', { domain: root })], { moduleName: 'marketing' });

    expect(() => getWebEntryPlacements([shell, other])).toThrow('Web entries shell/website and marketing/site are both on the root domain');
  });

  it('throws when two routed entries share a subdomain', () => {
    const other = buildTestQpqConfig([defineWebEntry('remotes', { domain: sub('views') })], { moduleName: 'other' });

    expect(() => getWebEntryPlacements([shell, other])).toThrow('Web entries shell/views and other/remotes are both at /views');
  });

  it('throws for an unported entry with no domain placement', () => {
    const nowhere = buildTestQpqConfig([defineWebEntry('cdn', { domain: { onRootDomain: false } })], { moduleName: 'assets' });

    expect(() => getWebEntryPlacements([nowhere])).toThrow('Web entry assets/cdn is neither on the root domain nor on a subdomain');
  });
});
