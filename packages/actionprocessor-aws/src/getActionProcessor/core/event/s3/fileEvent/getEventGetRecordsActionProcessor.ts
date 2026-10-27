import {
  actionResult,
  askEventGetRecordsBase,
  createActionProcessor,
  EventActionType,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
  splitScopedFilePath,
} from 'quidproquo-core';
import { StorageDriveEventType } from 'quidproquo-webserver';

import { EventInput, GLOBAL_STORAGE_DRIVE_NAME, InternalEventRecord } from './types';

// On a scoped drive the first key segment is the scope; an object without one
// was written outside the framework, and splitScopedFilePath throws so the
// event fails loudly instead of delivering a stray as unscoped.
const toInternalEventRecord = (key: string, eventType: StorageDriveEventType, scoped: boolean): InternalEventRecord => {
  if (!scoped) {
    return { driveName: GLOBAL_STORAGE_DRIVE_NAME, filePaths: [key], eventType };
  }

  const { scope, filepath } = splitScopedFilePath(key);

  return { driveName: GLOBAL_STORAGE_DRIVE_NAME, scope, filePaths: [filepath], eventType };
};

const getProcessGetRecords = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetRecordsBase> => {
  const scoped = qpqCoreUtils.getStorageDriveByName(GLOBAL_STORAGE_DRIVE_NAME, qpqConfig)?.scoped ?? false;

  return async ({ eventParams }) => {
    // Registered for one event source only, so the base requester's
    // source-agnostic payload is narrowed to this source's types here.
    const [s3Event, context] = eventParams as EventInput;

    const records = s3Event.Records.map((r) =>
      toInternalEventRecord(
        decodeURIComponent(r.s3.object.key),
        r.eventName.startsWith('ObjectCreated') ? StorageDriveEventType.Create : StorageDriveEventType.Delete,
        scoped,
      ),
    );

    return actionResult(records);
  };
};

export const getEventGetRecordsActionProcessor = createActionProcessor(askEventGetRecordsBase, getProcessGetRecords);
