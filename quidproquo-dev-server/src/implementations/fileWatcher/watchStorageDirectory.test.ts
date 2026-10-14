import { Nullable } from 'quidproquo-core';

import { readFileSync } from 'fs';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { StorageDirectoryWatcher } from './types/StorageDirectoryWatcher';
import { watchStorageDirectory } from './watchStorageDirectory';

// Events come from the OS (FSEvents on macOS, inotify on Linux), so a positive
// assertion polls until it holds, and a negative one waits out the 500ms
// stability window with margin before concluding nothing was reported.
const QUIET_PERIOD_MS = 1500;

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const waitFor = async (condition: () => boolean, timeoutMs = 5000): Promise<void> => {
  const deadline = Date.now() + timeoutMs;

  while (!condition()) {
    if (Date.now() > deadline) {
      throw new Error(`condition not met within ${timeoutMs}ms`);
    }

    await sleep(50);
  }
};

let storagePath: string;
let created: string[];
let deleted: string[];
let contentsAtCreate: Record<string, string>;
let watcher: Nullable<StorageDirectoryWatcher>;

// Reading the file inside the callback is what proves the write had finished.
const recordCreated = (filePath: string): void => {
  created.push(filePath);
  contentsAtCreate[filePath] = readFileSync(filePath, 'utf8');
};

const recordDeleted = (filePath: string): void => {
  deleted.push(filePath);
};

const startWatching = async (): Promise<void> => {
  watcher = await watchStorageDirectory(storagePath, { onFileCreated: recordCreated, onFileDeleted: recordDeleted });
};

const storageFile = (relativePath: string): string => path.join(storagePath, relativePath);

const writeFile = async (relativePath: string, contents: string): Promise<string> => {
  const filePath = storageFile(relativePath);

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, contents);

  return filePath;
};

beforeEach(async () => {
  storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'qpq-storage-watch-'));
  created = [];
  deleted = [];
  contentsAtCreate = {};
  watcher = null;
});

afterEach(async () => {
  await watcher?.close();
  await fs.rm(storagePath, { recursive: true, force: true });
});

describe('watchStorageDirectory', { timeout: 10_000 }, () => {
  it('reports a new file once, after its writes have stopped, with complete contents', async () => {
    await startWatching();

    const filePath = await writeFile('svc/drive/report.txt', 'part1');
    await sleep(150);
    await fs.appendFile(filePath, 'part2');
    await sleep(150);
    await fs.appendFile(filePath, 'part3');

    await waitFor(() => created.length === 1);
    await sleep(QUIET_PERIOD_MS);

    expect(created).toEqual([filePath]);
    expect(contentsAtCreate[filePath]).toBe('part1part2part3');
    expect(deleted).toEqual([]);
  });

  it('does not report files that already existed, even when rewritten in place or replaced by rename', async () => {
    const existing = await writeFile('svc/drive/existing.json', '{"v":1}');
    await startWatching();

    await fs.writeFile(existing, '{"v":2}');
    await sleep(100);
    const temp = `${existing}.1.2.tmp`;
    await fs.writeFile(temp, '{"v":3}');
    await fs.rename(temp, existing);
    await sleep(QUIET_PERIOD_MS);

    expect(created).toEqual([]);
    expect(deleted).toEqual([]);
  });

  it('reports a deleted file', async () => {
    const existing = await writeFile('svc/drive/existing.json', '{}');
    await startWatching();

    await fs.unlink(existing);

    await waitFor(() => deleted.length === 1);
    expect(deleted).toEqual([existing]);
    expect(created).toEqual([]);
  });

  it('reports a file written straight into a directory created after the watch started', async () => {
    await startWatching();

    const filePath = await writeFile('svc/drive/new/deeper/file.json', '{}');

    await waitFor(() => created.length === 1);
    expect(created).toEqual([filePath]);
  });

  it('ignores hidden entries, node_modules and temp files', async () => {
    await startWatching();

    await writeFile('svc/drive/.hidden', 'x');
    await writeFile('svc/drive/.git/HEAD', 'x');
    await writeFile('svc/drive/node_modules/pkg.js', 'x');
    await writeFile('svc/drive/store.json.1.2.tmp', 'x');
    await sleep(QUIET_PERIOD_MS);

    expect(created).toEqual([]);
  });

  it('never reports a file that is deleted before its writes settle', async () => {
    await startWatching();

    const filePath = await writeFile('svc/drive/short-lived.json', '{}');
    await fs.unlink(filePath);
    await sleep(QUIET_PERIOD_MS);

    expect(created).toEqual([]);
    expect(deleted).toEqual([]);
  });

  it('reports nothing after close', async () => {
    await startWatching();
    await watcher?.close();

    await writeFile('svc/drive/late.json', '{}');
    await sleep(QUIET_PERIOD_MS);

    expect(created).toEqual([]);
  });
});
