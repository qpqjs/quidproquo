import { createSecureUrlToken } from 'quidproquo-actionprocessor-node';

import * as fs from 'fs/promises';
import * as net from 'net';
import * as os from 'os';
import * as path from 'path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';

import { DevServerPluginStop } from '../plugins/types/DevServerPluginStop';
import { fileStorageImplementation } from './fileStorageImplementation';

const SECRET = 'test-secret';

// A port nothing else is listening on.
const freePort = (): Promise<number> =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, () => {
      const { port } = server.address() as net.AddressInfo;
      server.close(() => resolve(port));
    });
  });

describe('fileStorageImplementation secure upload (PUT)', () => {
  let storagePath: string;
  let port: number;
  let stop: DevServerPluginStop;

  const uploadUrl = (filepath: string) => {
    const token = createSecureUrlToken({ fullFilepath: filepath, operation: 'upload', expiresAt: Date.now() + 60_000 }, SECRET);
    return `http://localhost:${port}/secure-upload?token=${encodeURIComponent(token)}`;
  };

  beforeAll(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'qpq-file-storage-'));
    port = await freePort();
    const devServerConfig = {
      fileStorageConfig: { storagePath, secureUrlPort: port, secureUrlPublicPort: port, secureUrlHost: 'localhost', secureUrlSecret: SECRET },
    } as any;
    stop = await fileStorageImplementation(devServerConfig);
    // It starts listening in the background; wait until it answers.
    for (let attempt = 0; attempt < 50; attempt++) {
      const healthy = await fetch(`http://localhost:${port}/health`)
        .then((r) => r.ok)
        .catch(() => false);
      if (healthy) break;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  });

  afterAll(async () => {
    await stop?.();
    await fs.rm(storagePath, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('stores the exact bytes of a PUT that sends no Content-Type, as S3 does', async () => {
    const filepath = path.join(storagePath, 'uploads', 'no-type.json');
    const bytes = Buffer.from('{"bundle":true,"n":1}');

    const response = await fetch(uploadUrl(filepath), { method: 'PUT', body: bytes });

    expect(response.status).toBe(200);
    expect(await fs.readFile(filepath)).toEqual(bytes);
    await expect(fs.stat(`${filepath}.qpqmeta.json`)).rejects.toThrow();
  });

  it('stores a JSON body byte for byte (not re-serialised) and remembers its Content-Type', async () => {
    const filepath = path.join(storagePath, 'uploads', 'typed.json');
    const bytes = Buffer.from('{ "spaced" :  "as sent" }');

    const response = await fetch(uploadUrl(filepath), { method: 'PUT', headers: { 'content-type': 'application/json' }, body: bytes });

    expect(response.status).toBe(200);
    expect(await fs.readFile(filepath)).toEqual(bytes);
    expect(JSON.parse(await fs.readFile(`${filepath}.qpqmeta.json`, 'utf8'))).toEqual({ mimetype: 'application/json' });
  });

  it('stores binary bodies unchanged', async () => {
    const filepath = path.join(storagePath, 'uploads', 'binary.bin');
    const bytes = Buffer.from([0, 255, 16, 128, 10, 13]);

    const response = await fetch(uploadUrl(filepath), { method: 'PUT', headers: { 'content-type': 'application/octet-stream' }, body: bytes });

    expect(response.status).toBe(200);
    expect(await fs.readFile(filepath)).toEqual(bytes);
  });

  it('refuses a PUT with no body', async () => {
    const response = await fetch(uploadUrl(path.join(storagePath, 'uploads', 'empty.json')), { method: 'PUT' });

    expect(response.status).toBe(400);
  });

  it('refuses a PUT with a bad token', async () => {
    const response = await fetch(`http://localhost:${port}/secure-upload?token=not-a-token`, { method: 'PUT', body: Buffer.from('x') });

    expect(response.status).toBe(401);
  });
});
