import * as fs from 'fs';
import { AddressInfo, Server } from 'net';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { startHost } from './webEntryHostsImplementation';

const host = { service: 'shell', entryName: 'website', port: 0, webEntry: { indexRoot: 'index.html' }, configRoot: '/' } as any;

describe('startHost', () => {
  let root: string;
  let server: Server;
  let baseUrl: string;

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-web-entry-'));
    fs.mkdirSync(path.join(root, 'site'));
    fs.writeFileSync(path.join(root, 'site', 'index.html'), '<html>index</html>');
    fs.writeFileSync(path.join(root, 'site', 'app.js'), 'console.log(1)');
    fs.writeFileSync(path.join(root, 'secret.txt'), 'outside the web root');
    server = startHost(host, path.join(root, 'site'));
    await new Promise<void>((resolve) => server.once('listening', () => resolve()));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    fs.rmSync(root, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('serves files under the web root and falls back to the index for client routes', async () => {
    expect(await (await fetch(`${baseUrl}/app.js`)).text()).toBe('console.log(1)');
    expect(await (await fetch(`${baseUrl}/some/client/route`, { headers: { accept: 'text/html' } })).text()).toBe('<html>index</html>');
  });

  // Security regression: a ported web entry serves one built directory; a traversal, encoded or not, must
  // never read a sibling of the web root.
  it.each(['/../secret.txt', '/%2e%2e/secret.txt', '/..%2fsecret.txt', '/site/../../secret.txt'])(
    'never serves %s from outside the web root',
    async (route) => {
      const response = await fetch(`${baseUrl}${route}`, { headers: { accept: 'application/json' } });

      expect(await response.text()).not.toContain('outside the web root');
    },
  );
});
