import { buildTestQpqConfig, defineStorageDrive, EventActionType, InvalidScopeError } from 'quidproquo-core';
import { StorageDriveEventType } from 'quidproquo-webserver';

import { describe, expect, it, vi } from 'vitest';

import { resolveEventProcessor } from '../../../../../testing/eventProcessorTestHelpers';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

// The drive name is read from the lambda environment at module load, so it is
// pinned here rather than through process.env.
vi.mock('./types', () => ({ GLOBAL_STORAGE_DRIVE_NAME: 'uploads' }));

const buildS3Record = (key: string): any => ({ eventName: 'ObjectCreated:Put', s3: { object: { key } } });

describe('s3/fileEvent getEventGetRecordsActionProcessor on a scoped drive', () => {
  const qpqConfig = buildTestQpqConfig([defineStorageDrive('uploads', { scoped: true })]);

  it('splits the scope off the key and makes the file path scope-relative', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords, qpqConfig);

    const [records] = await processor({ eventParams: [{ Records: [buildS3Record('TENANT%23a/docs/x.pdf')] }, {}] });

    expect(records).toEqual([{ driveName: 'uploads', scope: 'TENANT#a', filePaths: ['docs/x.pdf'], eventType: StorageDriveEventType.Create }]);
  });

  it('fails loudly for an object with no scope segment', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords, qpqConfig);

    await expect(processor({ eventParams: [{ Records: [buildS3Record('stray.pdf')] }, {}] })).rejects.toThrow(InvalidScopeError);
  });

  it('leaves keys untouched on an unscoped drive', async () => {
    const unscoped = buildTestQpqConfig([defineStorageDrive('uploads')]);
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords, unscoped);

    const [records] = await processor({ eventParams: [{ Records: [buildS3Record('TENANT%23a/docs/x.pdf')] }, {}] });

    expect((records as any[])[0]).toEqual({ driveName: 'uploads', filePaths: ['TENANT#a/docs/x.pdf'], eventType: StorageDriveEventType.Create });
  });
});
