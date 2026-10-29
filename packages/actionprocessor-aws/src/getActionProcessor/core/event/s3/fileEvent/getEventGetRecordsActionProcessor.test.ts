import { EventActionType } from '@qpqjs/core';
import { resolveEventProcessor } from '@qpqjs/testing';
import { StorageDriveEventType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';

const buildS3Record = (eventName: string, key: string): any => ({ eventName, s3: { object: { key } } });

describe('s3/fileEvent getEventGetRecordsActionProcessor', () => {
  it('maps an ObjectCreated record to a create event with a decoded file path', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);

    const [records] = await processor({ eventParams: [{ Records: [buildS3Record('ObjectCreated:Put', 'folder/a%20b.txt')] }, {}] });

    expect(records).toEqual([{ driveName: undefined, filePaths: ['folder/a b.txt'], eventType: StorageDriveEventType.Create }]);
  });

  it('maps a non ObjectCreated record to a delete event', async () => {
    const processor = await resolveEventProcessor(getEventGetRecordsActionProcessor, EventActionType.GetRecords);

    const [records] = await processor({ eventParams: [{ Records: [buildS3Record('ObjectRemoved:Delete', 'gone.txt')] }, {}] });

    expect((records as any[])[0].eventType).toBe(StorageDriveEventType.Delete);
  });
});
