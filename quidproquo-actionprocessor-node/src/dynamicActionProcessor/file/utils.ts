import { assertStorageDriveScopeRequirementOrThrow, QPQConfig, qpqCoreUtils, validateScopeSegment } from 'quidproquo-core';

import * as fs from 'fs/promises';
import * as path from 'path';

import { FileStorageConfig } from './types';

// Resolve a drive name to a filesystem path
export const isStorageDriveNameValid = (drive: string, qpqConfig: QPQConfig): boolean => {
  const storageDrive = qpqCoreUtils.getStorageDrives(qpqConfig).find((d) => d.storageDrive === drive);

  if (!storageDrive) {
    return false;
  }

  return true;
};

// Resolve the service that owns a drive's on-disk location. Drives declared with
// `owner.module` are shared across services, so every caller reads and writes
// under the owner's folder — mirroring how AWS resolves the bucket by owner.
export function resolveDriveServiceName(drive: string, qpqConfig: QPQConfig): string {
  const storageDrive = qpqCoreUtils.getStorageDriveByName(drive, qpqConfig);
  return storageDrive?.owner?.module ?? qpqCoreUtils.getApplicationModuleName(qpqConfig);
}

export function resolveFilePath(fileStorageConfig: FileStorageConfig, qpqConfig: QPQConfig, drive: string, filepath: string, scope?: string): string {
  const service = resolveDriveServiceName(drive, qpqConfig);

  assertStorageDriveScopeRequirementOrThrow(qpqConfig, drive, scope);

  // A scope becomes part of the root, so the escape check below also guarantees
  // the filepath cannot traverse out of its scope, not just out of the drive.
  if (scope !== undefined) {
    validateScopeSegment(scope);
  }

  const root = scope
    ? path.resolve(fileStorageConfig.storagePath, service, drive, scope)
    : path.resolve(fileStorageConfig.storagePath, service, drive);

  // Block absolute paths and null bytes outright
  if (path.isAbsolute(filepath)) {
    throw new Error('Absolute paths are not allowed.');
  }

  // Check for null to prevent directory traversal attacks in native libs
  if (filepath.includes('\0')) {
    throw new Error('Invalid path.');
  }

  // Normalize user input (collapses ., .., slashes)
  const cleaned = path.normalize(filepath);

  // Resolve against the root
  const target = path.resolve(root, cleaned);

  // Ensure target stays within root
  const rel = path.relative(root, target);
  if (rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))) {
    return target;
  }

  throw new Error('Invalid file path: escapes drive root.');
}

// Ensure a directory exists
export const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  await fs.mkdir(dirPath, { recursive: true });
};

// Ensure the parent directory of a file exists
export const ensureParentDirectoryExists = async (filePath: string): Promise<void> => {
  const parentDir = path.dirname(filePath);
  await ensureDirectoryExists(parentDir);
};
