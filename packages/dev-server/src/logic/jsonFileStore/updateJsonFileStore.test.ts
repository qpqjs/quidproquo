import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { readJsonFileStore, writeJsonFileStore } from './jsonFileStore';
import { updateJsonFileStore } from './updateJsonFileStore';

describe('json file store updates', () => {
  let runtimePath: string;

  beforeEach(() => {
    runtimePath = fs.mkdtempSync(path.join(os.tmpdir(), 'qpq-json-store-'));
  });

  afterEach(() => {
    fs.rmSync(runtimePath, { recursive: true, force: true });
  });

  it('serialises concurrent read-modify-writes to one file so no update is lost', async () => {
    await Promise.all(
      Array.from({ length: 10 }, (_, index) =>
        updateJsonFileStore<number>(runtimePath, 'store', 'counts', (values) => ({ ...values, [`key-${index}`]: index })),
      ),
    );

    expect(Object.keys(await readJsonFileStore(runtimePath, 'store', 'counts'))).toHaveLength(10);
  });

  it('survives two plain writes in the same millisecond', async () => {
    await expect(
      Promise.all([writeJsonFileStore(runtimePath, 'store', 'same', { a: 1 }), writeJsonFileStore(runtimePath, 'store', 'same', { b: 2 })]),
    ).resolves.toBeDefined();
    expect(fs.readdirSync(path.join(runtimePath, 'store')).filter((name) => name.endsWith('.tmp'))).toEqual([]);
  });
});
