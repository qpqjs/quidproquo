import { assertStorageDriveScopeRequirementOrThrow, QPQConfig, validateScopeSegment } from '@qpqjs/core';

import * as path from 'path';

import { FileStorageConfig } from '../types';
import { resolveDriveServiceName } from './resolveDriveServiceName';

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
