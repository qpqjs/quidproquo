import { defineCryptoKey } from '@qpqjs/core';
import { buildTestQpqConfig } from '@qpqjs/testing';

import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { getOrSeedCryptoMasterKey } from './getOrSeedCryptoMasterKey';

const qpqConfig = buildTestQpqConfig([defineCryptoKey('docs'), defineCryptoKey('other')]);

describe('getOrSeedCryptoMasterKey', () => {
  let runtimePath: string;

  beforeEach(async () => {
    runtimePath = await fs.mkdtemp(path.join(os.tmpdir(), 'qpq-crypto-keys-'));
  });

  afterEach(async () => {
    await fs.rm(runtimePath, { recursive: true, force: true });
  });

  it('seeds a 32 byte key once and returns the same key on later calls', async () => {
    const first = await getOrSeedCryptoMasterKey(runtimePath, 'docs', qpqConfig);
    const second = await getOrSeedCryptoMasterKey(runtimePath, 'docs', qpqConfig);

    expect(first.length).toBe(32);
    expect(second.equals(first)).toBe(true);
  });

  it('seeds a different key per key name', async () => {
    const docs = await getOrSeedCryptoMasterKey(runtimePath, 'docs', qpqConfig);
    const other = await getOrSeedCryptoMasterKey(runtimePath, 'other', qpqConfig);

    expect(other.equals(docs)).toBe(false);
  });

  // Security regression: the key file stands in for a KMS key on a shared dev box, so only the
  // owner may read it.
  it.skipIf(process.platform === 'win32')('writes the key store readable by its owner only', async () => {
    await getOrSeedCryptoMasterKey(runtimePath, 'docs', qpqConfig);

    const { mode } = await fs.stat(path.join(runtimePath, 'cryptoKeys', 'test-module.json'));

    expect((mode & 0o777).toString(8)).toBe('600');
  });
});
