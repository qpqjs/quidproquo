import { ErrorTypeEnum, EventActionType, storageScopeContext } from 'quidproquo-core';
import { StorageDriveEventType } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { resolveEventProcessor } from '../../../../../testing/eventProcessorTestHelpers';
import { getEventAutoRespondActionProcessor } from './getEventAutoRespondActionProcessor';
import { getEventGetRecordsActionProcessor } from './getEventGetRecordsActionProcessor';
import { getEventGetStorySessionActionProcessor } from './getEventGetStorySessionActionProcessor';
import { getEventMatchStoryActionProcessor } from './getEventMatchStoryActionProcessor';
import { getEventTransformResponseResultActionProcessor } from './getEventTransformResponseResultActionProcessor';

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

describe('s3/fileEvent getEventMatchStoryActionProcessor', () => {
  it('returns the storage drive runtime from the environment default', async () => {
    const processor = await resolveEventProcessor(getEventMatchStoryActionProcessor, EventActionType.MatchStory);

    const [match] = await processor({ qpqEventRecord: {} });

    expect((match as any).runtime).toBe('/::');
  });
});

describe('s3/fileEvent getEventTransformResponseResultActionProcessor', () => {
  it('returns void when every file processed successfully', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);

    expect(await processor({ eventParams: [{}], qpqEventRecordResponses: [{ success: true, result: {} }] })).toEqual([undefined]);
  });

  it('returns a generic error when any file failed', async () => {
    const processor = await resolveEventProcessor(getEventTransformResponseResultActionProcessor, EventActionType.TransformResponseResult);
    const responses = [
      { success: true, result: {} },
      { success: false, error: { errorType: ErrorTypeEnum.GenericError, errorText: 'x' } },
    ];

    const [, error] = await processor({ eventParams: [{}], qpqEventRecordResponses: responses });

    expect(error?.errorType).toBe(ErrorTypeEnum.GenericError);
    expect(error?.errorText).toBe('[1] files unable to be processed.');
  });
});

describe('s3/fileEvent auto respond and story session', () => {
  it('auto responds with null', async () => {
    const processor = await resolveEventProcessor(getEventAutoRespondActionProcessor, EventActionType.AutoRespond);

    expect(await processor({ qpqEventRecord: {}, matchResult: {} })).toEqual([null]);
  });

  it('returns no story session for an unscoped record', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession);

    expect(await processor({ qpqEventRecord: {}, eventParams: [] })).toEqual([undefined]);
  });

  it('runs a scoped record under its scope as the ambient storage scope', async () => {
    const processor = await resolveEventProcessor(getEventGetStorySessionActionProcessor, EventActionType.GetStorySession);

    const [session] = await processor({ qpqEventRecord: { scope: 'TENANT#a' }, eventParams: [] });

    expect((session as any).context[storageScopeContext.uniqueName]).toBe('TENANT#a');
  });
});
