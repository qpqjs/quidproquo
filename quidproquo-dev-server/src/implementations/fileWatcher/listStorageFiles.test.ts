import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { listStorageFiles } from './listStorageFiles';

let storagePath: string;

const writeFile = async (relativePath: string): Promise<string> => {
  const filePath = path.join(storagePath, relativePath);

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, relativePath);

  return filePath;
};

beforeEach(async () => {
  storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'qpq-list-storage-'));
});

afterEach(async () => {
  await fs.rm(storagePath, { recursive: true, force: true });
});

describe('listStorageFiles', () => {
  it('lists regular files recursively, pruning ignored entries and symlinks', async () => {
    const a = await writeFile('svc/drive/a.json');
    const b = await writeFile('svc/drive/nested/deeper/b.json');
    await writeFile('svc/drive/.hidden/c.json');
    await writeFile('svc/drive/.dotfile');
    await writeFile('svc/drive/node_modules/d.js');
    await writeFile('svc/drive/e.tmp');
    await fs.symlink(a, path.join(storagePath, 'svc/drive/link.json'));
    await fs.symlink(path.join(storagePath, 'svc/drive/nested'), path.join(storagePath, 'svc/drive/linkdir'));

    const files = await listStorageFiles(storagePath);

    expect(files.sort()).toEqual([a, b].sort());
  });

  it('lists only the given subdirectory while applying ignore rules relative to the root', async () => {
    await writeFile('svc/drive/a.json');
    const b = await writeFile('svc/drive/nested/b.json');
    await writeFile('svc/drive/nested/c.tmp');

    const files = await listStorageFiles(storagePath, path.join(storagePath, 'svc/drive/nested'));

    expect(files).toEqual([b]);
  });

  it('treats a missing directory as empty', async () => {
    const files = await listStorageFiles(storagePath, path.join(storagePath, 'svc/gone'));

    expect(files).toEqual([]);
  });
});
