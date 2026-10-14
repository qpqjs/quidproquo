import { Nullable } from 'quidproquo-core';

import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';

import { StorageDirectoryWatcher } from './types/StorageDirectoryWatcher';
import { StorageFileEventHandlers } from './types/StorageFileEventHandlers';
import { isIgnoredStoragePath } from './isIgnoredStoragePath';
import { isMissingPathError } from './isMissingPathError';
import { listStorageFiles } from './listStorageFiles';

// A file is reported once its size and mtime have held still for the stability
// window, sampled at the poll interval, so a handler never reads a file that is
// still being written.
const WRITE_STABILITY_MS = 500;
const WRITE_POLL_INTERVAL_MS = 100;

type FileSample = {
  size: number;
  mtimeMs: number;
};

type PendingCheck = {
  timer: NodeJS.Timeout;
  lastSample: Nullable<FileSample>;
  stableForMs: number;
};

const lstatOrNull = async (filePath: string): Promise<Nullable<fs.Stats>> => {
  try {
    return await fsp.lstat(filePath);
  } catch (error) {
    if (isMissingPathError(error)) {
      return null;
    }

    throw error;
  }
};

const isSameSample = (previous: Nullable<FileSample>, current: FileSample): boolean =>
  previous !== null && previous.size === current.size && previous.mtimeMs === current.mtimeMs;

/**
 * Reports regular files created under or deleted from storagePath, resolving
 * once the files already there are known (those are never reported).
 *
 * One recursive OS watch covers the whole tree: on macOS that is a single
 * FSEvents stream, whereas a watch per file (kqueue) grows the fd table on a
 * high-churn drive (qpq-logs writes a file per story execution) until
 * child_process.spawn fails with EBADF.
 */
export const watchStorageDirectory = async (storagePath: string, handlers: StorageFileEventHandlers): Promise<StorageDirectoryWatcher> => {
  const knownFiles = new Set<string>();
  const pendingChecks = new Map<string, PendingCheck>();

  const report = (filePath: string, exists: boolean): void => {
    try {
      if (exists && !knownFiles.has(filePath)) {
        knownFiles.add(filePath);
        handlers.onFileCreated(filePath);
      } else if (!exists && knownFiles.has(filePath)) {
        knownFiles.delete(filePath);
        handlers.onFileDeleted(filePath);
      }
    } catch (error) {
      console.error('File watcher handler error:', filePath, error);
    }
  };

  const scheduleCheck = (filePath: string): void => {
    // A check already running sees any further change on its next sample.
    if (pendingChecks.has(filePath)) {
      return;
    }

    pendingChecks.set(filePath, {
      timer: setTimeout(() => void check(filePath), WRITE_POLL_INTERVAL_MS),
      lastSample: null,
      stableForMs: 0,
    });
  };

  // A directory event is the only hint of files written into a new directory
  // before the OS watch covered it (Linux adds an inotify watch per directory),
  // so its contents are checked as if each had raised its own event.
  const checkDirectory = async (directory: string): Promise<void> => {
    for (const filePath of await listStorageFiles(storagePath, directory)) {
      if (!knownFiles.has(filePath)) {
        scheduleCheck(filePath);
      }
    }
  };

  const check = async (filePath: string): Promise<void> => {
    const stats = await lstatOrNull(filePath);
    const pending = pendingChecks.get(filePath);

    // Closed while the stat was in flight.
    if (!pending) {
      return;
    }

    if (stats === null) {
      pendingChecks.delete(filePath);
      report(filePath, false);
      return;
    }

    if (stats.isDirectory()) {
      pendingChecks.delete(filePath);
      await checkDirectory(filePath);
      return;
    }

    // Symlinks are not followed, and sockets and the like are not storage.
    if (!stats.isFile()) {
      pendingChecks.delete(filePath);
      return;
    }

    const sample: FileSample = { size: stats.size, mtimeMs: stats.mtimeMs };
    pending.stableForMs = isSameSample(pending.lastSample, sample) ? pending.stableForMs + WRITE_POLL_INTERVAL_MS : 0;
    pending.lastSample = sample;

    if (pending.stableForMs >= WRITE_STABILITY_MS) {
      pendingChecks.delete(filePath);
      report(filePath, true);
      return;
    }

    pending.timer = setTimeout(() => void check(filePath), WRITE_POLL_INTERVAL_MS);
  };

  // The event type is not reliable (macOS reports every change as a rename), so
  // the path is re-examined rather than trusted.
  const onWatchEvent = (_eventType: fs.WatchEventType, filename: Nullable<string>): void => {
    if (filename === null || filename.length === 0 || isIgnoredStoragePath(filename)) {
      return;
    }

    scheduleCheck(path.resolve(storagePath, filename));
  };

  const watcher = fs.watch(storagePath, { persistent: true, recursive: true }, onWatchEvent);
  watcher.on('error', (error) => console.error('File watcher error:', error));

  // The watch is live before the walk so nothing written meanwhile is missed;
  // whatever the walk finds counts as pre-existing.
  for (const filePath of await listStorageFiles(storagePath)) {
    knownFiles.add(filePath);
  }

  const close = async (): Promise<void> => {
    watcher.close();

    for (const pending of pendingChecks.values()) {
      clearTimeout(pending.timer);
    }

    pendingChecks.clear();
  };

  return { close };
};
