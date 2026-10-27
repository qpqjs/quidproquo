import { defineStorageDrive, InvalidScopeError } from '@qpqjs/core';
import { StorageDriveEventType } from '@qpqjs/webserver';

import * as path from 'path';
import { describe, expect, it } from 'vitest';

import { toStorageDriveEvent } from './toStorageDriveEvent';

const payload = (filepath: string) => ({ service: 'svc', drive: 'uploads', filepath, event: 'create' as const });

describe('toStorageDriveEvent', () => {
  it('lifts the first folder into the scope on a scoped drive, normalising the platform separator', () => {
    const event = toStorageDriveEvent(payload(['TENANT#a', 'docs', 'x.pdf'].join(path.sep)), defineStorageDrive('uploads', { scoped: true }));

    expect(event).toEqual({ eventType: StorageDriveEventType.Create, driveName: 'uploads', scope: 'TENANT#a', filePaths: ['docs/x.pdf'] });
  });

  it('keeps the whole path on an unscoped drive', () => {
    expect(toStorageDriveEvent(payload('TENANT#a/docs/x.pdf'), defineStorageDrive('uploads')).filePaths).toEqual(['TENANT#a/docs/x.pdf']);
  });

  // Security regression: the dev watcher applies the same first-folder rule as S3, so a stray file at the
  // drive root or under a traversal-shaped folder fails instead of running a handler unscoped or under that folder.
  it.each(['stray.pdf', '../docs/x.pdf', './docs/x.pdf', '@@QPQSCOPE@@/x.pdf'])('fails for the scoped-drive path %s', (filepath: string) => {
    expect(() => toStorageDriveEvent(payload(filepath), defineStorageDrive('uploads', { scoped: true }))).toThrow(InvalidScopeError);
  });
});
