import { buildTestQpqConfig, defineStorageDrive } from 'quidproquo-core';

import * as fs from 'fs/promises';
import * as path from 'path';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { fileConfig } from '../../testing/fileProcessorTestHelpers';
import { ensureDirectoryExists, ensureParentDirectoryExists, isStorageDriveNameValid, resolveDriveServiceName, resolveFilePath } from './utils';

vi.mock('fs/promises');

const moduleName = 'test-module';

afterEach(() => {
  vi.clearAllMocks();
});

describe('isStorageDriveNameValid', () => {
  it('returns true for a declared drive', () => {
    const qpqConfig = buildTestQpqConfig([defineStorageDrive('media')]);

    expect(isStorageDriveNameValid('media', qpqConfig)).toBe(true);
  });

  it('returns false for an undeclared drive', () => {
    const qpqConfig = buildTestQpqConfig([defineStorageDrive('media')]);

    expect(isStorageDriveNameValid('missing', qpqConfig)).toBe(false);
  });
});

describe('resolveDriveServiceName', () => {
  it('defaults to the application module when the drive has no owner', () => {
    const qpqConfig = buildTestQpqConfig([defineStorageDrive('media')]);

    expect(resolveDriveServiceName('media', qpqConfig)).toBe(moduleName);
  });

  it('returns the owning module for a shared drive', () => {
    const qpqConfig = buildTestQpqConfig([defineStorageDrive('shared', { owner: { module: 'owner-module', storageDriveName: 'shared' } })]);

    expect(resolveDriveServiceName('shared', qpqConfig)).toBe('owner-module');
  });

  it('defaults to the application module for an unknown drive', () => {
    const qpqConfig = buildTestQpqConfig([defineStorageDrive('media')]);

    expect(resolveDriveServiceName('missing', qpqConfig)).toBe(moduleName);
  });
});

describe('resolveFilePath', () => {
  const qpqConfig = buildTestQpqConfig([defineStorageDrive('media'), defineStorageDrive('tenantMedia', { scoped: true })]);

  it('resolves a relative path under the drive root', () => {
    const expected = path.resolve(fileConfig.storagePath, moduleName, 'media', 'a/b.txt');

    expect(resolveFilePath(fileConfig, qpqConfig, 'media', 'a/b.txt')).toBe(expected);
  });

  it('allows a path that normalizes back to the root', () => {
    const expected = path.resolve(fileConfig.storagePath, moduleName, 'media', 'a/b.txt');

    expect(resolveFilePath(fileConfig, qpqConfig, 'media', './a/../a/b.txt')).toBe(expected);
  });

  it('throws when the path is absolute', () => {
    expect(() => resolveFilePath(fileConfig, qpqConfig, 'media', '/etc/passwd')).toThrow('Absolute paths are not allowed.');
  });

  it('throws when the path contains a null byte', () => {
    expect(() => resolveFilePath(fileConfig, qpqConfig, 'media', 'a\0b')).toThrow('Invalid path.');
  });

  it('throws when the path escapes the drive root', () => {
    expect(() => resolveFilePath(fileConfig, qpqConfig, 'media', '../../etc/passwd')).toThrow('escapes drive root');
  });

  it('resolves under the scope segment when a scope is given', () => {
    const expected = path.resolve(fileConfig.storagePath, moduleName, 'tenantMedia', 'tenant-a', 'a/b.txt');

    expect(resolveFilePath(fileConfig, qpqConfig, 'tenantMedia', 'a/b.txt', 'tenant-a')).toBe(expected);
  });

  it('throws when the path escapes the scope root', () => {
    expect(() => resolveFilePath(fileConfig, qpqConfig, 'tenantMedia', '../tenant-b/secret.txt', 'tenant-a')).toThrow('escapes drive root');
  });

  it('refuses a scope/flag mismatch in either direction', () => {
    expect(() => resolveFilePath(fileConfig, qpqConfig, 'tenantMedia', 'a.txt')).toThrow('is scoped');
    expect(() => resolveFilePath(fileConfig, qpqConfig, 'media', 'a.txt', 'tenant-a')).toThrow('is not scoped');
  });

  it('rejects a scope containing separators or traversal outright', () => {
    expect(() => resolveFilePath(fileConfig, qpqConfig, 'tenantMedia', 'a.txt', 'tenant-a/../tenant-b')).toThrow(
      'Scope must not contain path separators',
    );
    expect(() => resolveFilePath(fileConfig, qpqConfig, 'tenantMedia', 'a.txt', '..')).toThrow('Scope must not contain path separators');
    expect(() => resolveFilePath(fileConfig, qpqConfig, 'tenantMedia', 'a.txt', '')).toThrow('Scope must not be empty.');
  });
});

describe('ensureDirectoryExists', () => {
  it('creates the directory recursively', async () => {
    await ensureDirectoryExists('/storage/media/sub');

    expect(fs.mkdir).toHaveBeenCalledWith('/storage/media/sub', { recursive: true });
  });
});

describe('ensureParentDirectoryExists', () => {
  it('creates the parent directory of a file recursively', async () => {
    await ensureParentDirectoryExists('/storage/media/sub/file.txt');

    expect(fs.mkdir).toHaveBeenCalledWith(path.dirname('/storage/media/sub/file.txt'), { recursive: true });
  });
});
