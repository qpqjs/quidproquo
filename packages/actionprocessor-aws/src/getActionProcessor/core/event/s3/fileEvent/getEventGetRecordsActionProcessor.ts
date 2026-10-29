import { actionResult, askEventGetRecordsBase, createActionProcessor, ProcessorFor, QPQConfig, qpqCoreUtils, splitScopedFilePath } from '@qpqjs/core';
import { StorageDriveEventType } from '@qpqjs/webserver';

import { EventInput, InternalEventRecord } from './types';

// On a scoped drive the first key segment is the scope; an object without one
// was written outside the framework, and splitScopedFilePath throws so the
// event fails loudly instead of delivering a stray as unscoped.
const toInternalEventRecord = (driveName: string, key: string, eventType: StorageDriveEventType, scoped: boolean): InternalEventRecord => {
  if (!scoped) {
    return { driveName, filePaths: [key], eventType };
  }

  const { scope, filepath } = splitScopedFilePath(key);

  return { driveName, scope, filePaths: [filepath], eventType };
};

const getProcessGetRecords = (qpqConfig: QPQConfig, storageDriveName: string): ProcessorFor<typeof askEventGetRecordsBase> => {
  const scoped = qpqCoreUtils.getStorageDriveByName(storageDriveName, qpqConfig)?.scoped ?? false;

  return async ({ eventParams }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const [s3Event] = eventParams as EventInput;

    const records = s3Event.Records.map((r) =>
      toInternalEventRecord(
        storageDriveName,
        decodeURIComponent(r.s3.object.key),
        r.eventName.startsWith('ObjectCreated') ? StorageDriveEventType.Create : StorageDriveEventType.Delete,
        scoped,
      ),
    );

    return actionResult(records);
  };
};

/** The drive the lambda serves comes from the handler, which reads it from the lambda environment once. */
export const getEventGetRecordsActionProcessor = (storageDriveName: string) =>
  createActionProcessor(askEventGetRecordsBase, (qpqConfig) => getProcessGetRecords(qpqConfig, storageDriveName));
