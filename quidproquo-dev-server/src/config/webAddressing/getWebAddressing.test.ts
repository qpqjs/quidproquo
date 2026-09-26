import { buildTestQpqConfig } from 'quidproquo-core';
import { defineApi, defineDns, defineWebEntry, defineWebsocket, DomainResolver, WebAddressingMode } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { defineDevServerOptions } from '../settings/defineDevServerOptions';
import { getWebAddressing } from './getWebAddressing';

const shell = buildTestQpqConfig(
  [
    defineDns(['example.com', 'example.org']),
    defineApi('api'),
    defineWebsocket('qpqadmin', {}),
    defineWebEntry('website', { domain: { onRootDomain: true } }),
    defineWebEntry('views', { domain: { onRootDomain: true, subDomainName: 'views' } }),
    defineWebEntry('docs', { domain: { onRootDomain: true, subDomainName: 'docs' } }),
    defineDevServerOptions({ webEntries: { docs: { port: 3090 } } }),
  ],
  { moduleName: 'shell', environment: 'production' },
);

describe('getWebAddressing', () => {
  it('bakes resolver hosts per root domain in subdomain mode', () => {
    expect(getWebAddressing([shell], null)).toEqual({
      mode: WebAddressingMode.subdomain,
      rootDomains: ['example.com', 'example.org'],
      entries: [
        { service: 'shell', name: 'views', hosts: ['views.example.com', 'views.example.org'], port: null, path: '/views' },
        { service: 'shell', name: 'website', hosts: ['example.com', 'example.org'], port: null, path: '/' },
        { service: 'shell', name: 'docs', hosts: ['docs.example.com', 'docs.example.org'], port: null, path: '/docs' },
      ],
      apis: [{ service: 'shell', apiSubdomain: 'api', hosts: ['api.example.com', 'api.example.org'] }],
      webSockets: [{ service: 'shell', apiSubdomain: 'qpqadmin', hosts: ['qpqadmin.shell.example.com', 'qpqadmin.shell.example.org'] }],
    });
  });

  it('resolves through the app resolver when given one', () => {
    const resolver: DomainResolver = { resolveHost: ({ rootDomain, subdomain }) => `${subdomain ?? 'www'}-custom.${rootDomain}` };

    const addressing = getWebAddressing([shell], null, () => resolver);

    expect(addressing.mode === WebAddressingMode.subdomain && addressing.apis[0].hosts).toEqual(['api-custom.example.com', 'api-custom.example.org']);
  });

  it('is port mode with host-side ports mapped and no hosts', () => {
    const mapHostPort = (port: number): number => (port === 8080 ? 80 : port);

    expect(getWebAddressing([shell], { api: 8080, webSocket: 8888, mapHostPort })).toEqual({
      mode: WebAddressingMode.port,
      apiPort: 80,
      webSocketPort: 8888,
      entries: [
        { service: 'shell', name: 'views', hosts: [], port: null, path: '/views' },
        { service: 'shell', name: 'website', hosts: [], port: null, path: '/' },
        { service: 'shell', name: 'docs', hosts: [], port: 3090, path: '/docs' },
      ],
    });
  });
});
