import { WebAddressing, WebAddressingMode } from 'quidproquo-webserver';

import { afterEach, describe, expect, it } from 'vitest';

import { getApiUrl } from './getApiUrl';
import { getFederatedViewsUrl } from './getFederatedViewsUrl';
import { getWebEntryUrl } from './getWebEntryUrl';
import { getWebSocketUrl } from './getWebSocketUrl';

const entries = (hosted: boolean) => [
  { service: 'shell', name: 'views', hosts: hosted ? ['views.dev.example.com', 'views.dev.example.org'] : [], port: null, path: '/views' },
  { service: 'shell', name: 'website', hosts: hosted ? ['dev.example.com', 'dev.example.org'] : [], port: null, path: '/' },
  { service: 'shell', name: 'docs', hosts: hosted ? ['docs.dev.example.com', 'docs.dev.example.org'] : [], port: 3090, path: '/docs' },
];

const subdomainAddressing: WebAddressing = {
  mode: WebAddressingMode.subdomain,
  rootDomains: ['example.com', 'example.org'],
  entries: entries(true),
  apis: [{ service: 'shell', apiSubdomain: 'api', hosts: ['api.dev.example.com', 'api.dev.example.org'] }],
  webSockets: [{ service: 'admin', apiSubdomain: 'qpqadmin', hosts: ['qpqadmin.admin.dev.example.com', 'qpqadmin.admin.dev.example.org'] }],
};

const bake = (addressing: WebAddressing): void => {
  process.env.QPQ_WEB_ADDRESSING = JSON.stringify(addressing);
};

afterEach(() => {
  delete process.env.QPQ_WEB_ADDRESSING;
});

describe('subdomain mode', () => {
  it('uses the baked hosts for the root domain the page is on', () => {
    bake(subdomainAddressing);
    const onOrg = { protocol: 'https:', hostname: 'views.dev.example.org' };

    expect(getWebEntryUrl('docs', undefined, onOrg)).toBe('https://docs.dev.example.org');
    expect(getWebEntryUrl('website', undefined, onOrg)).toBe('https://dev.example.org');
    expect(getApiUrl('shell', 'api', onOrg)).toBe('https://api.dev.example.org/shell');
    expect(getWebSocketUrl('admin', 'qpqadmin', onOrg)).toBe('wss://qpqadmin.admin.dev.example.org');
    expect(getFederatedViewsUrl('admin', onOrg)).toBe('https://views.dev.example.org/admin');
  });

  it('falls back to the primary root when the page host is not a known root', () => {
    bake(subdomainAddressing);

    expect(getApiUrl('shell', 'api', { protocol: 'https:', hostname: 'preview.somewhere.net' })).toBe('https://api.dev.example.com/shell');
  });

  it('throws for an api it does not know', () => {
    bake(subdomainAddressing);

    expect(() => getApiUrl('shell', 'other', { protocol: 'https:', hostname: 'example.com' })).toThrow("No api 'other' on service 'shell'");
  });
});

describe('port mode', () => {
  const lan = { protocol: 'http:', hostname: '192.168.1.50' };

  it('keeps the page host and swaps ports, omitting default ports', () => {
    bake({ mode: WebAddressingMode.port, apiPort: 80, webSocketPort: 8888, entries: entries(false) });

    expect(getWebEntryUrl('website', undefined, lan)).toBe('http://192.168.1.50');
    expect(getWebEntryUrl('views', undefined, lan)).toBe('http://192.168.1.50/views');
    expect(getWebEntryUrl('docs', undefined, lan)).toBe('http://192.168.1.50:3090');
    expect(getApiUrl('shell', 'api', lan)).toBe('http://192.168.1.50/api/shell');
    expect(getWebSocketUrl('admin', 'qpqadmin', lan)).toBe('ws://192.168.1.50:8888/admin/qpqadmin');
    expect(getFederatedViewsUrl('admin', lan)).toBe('http://192.168.1.50/views/admin');
  });

  it('is the dev server shape on localhost', () => {
    bake({ mode: WebAddressingMode.port, apiPort: 8080, webSocketPort: 8888, entries: entries(false) });

    expect(getApiUrl('admin', 'api', { protocol: 'http:', hostname: 'localhost' })).toBe('http://localhost:8080/api/admin');
  });
});

describe('nothing baked', () => {
  it('knows no entries or apis', () => {
    const site = { protocol: 'https:', hostname: 'example.com' };

    expect(() => getApiUrl('shell', 'api', site)).toThrow("No api 'api' on service 'shell'");
    expect(() => getWebEntryUrl('docs', undefined, site)).toThrow("No web entry named 'docs'");
  });
});
