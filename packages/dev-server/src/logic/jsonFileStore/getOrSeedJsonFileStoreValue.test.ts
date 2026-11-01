import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getOrSeedJsonFileStoreValue } from './getOrSeedJsonFileStoreValue';
import { readJsonFileStore } from './jsonFileStore';

describe('getOrSeedJsonFileStoreValue', () => {
  let runtimePath: string;

  beforeEach(() => {
    runtimePath = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-seed-'));
  });

  afterEach(() => {
    fs.rmSync(runtimePath, { recursive: true, force: true });
  });

  it('seeds once and returns the stored value afterwards without rebuilding it', async () => {
    const build = vi.fn(() => 'first');

    expect(await getOrSeedJsonFileStoreValue(runtimePath, 'store', 'svc', 'a', build)).toBe('first');
    expect(await getOrSeedJsonFileStoreValue(runtimePath, 'store', 'svc', 'a', () => 'second')).toBe('first');
    expect(build).toHaveBeenCalledTimes(1);
  });

  // Security regression: concurrent first uses must agree on one value, or a token signed with the losing
  // secret stops verifying the moment the other write lands.
  it('hands every concurrent first use of a key the same value and keeps sibling keys', async () => {
    let n = 0;
    const seeds = await Promise.all([
      ...Array.from({ length: 5 }, () => getOrSeedJsonFileStoreValue(runtimePath, 'store', 'svc', 'a', () => `a${(n += 1)}`)),
      getOrSeedJsonFileStoreValue(runtimePath, 'store', 'svc', 'b', () => 'b1'),
    ]);

    expect(new Set(seeds.slice(0, 5)).size).toBe(1);
    expect(await readJsonFileStore(runtimePath, 'store', 'svc')).toEqual({ a: seeds[0], b: 'b1' });
  });
});
