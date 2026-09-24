import { defineStorageDrive, QPQConfig, QpqFunctionRuntime } from 'quidproquo';

import { SMOKE_FILE_EVENT_DRIVE } from '../constants/SMOKE_FILE_EVENT_DRIVE';
import { SMOKE_SCOPED_PROBE_DRIVE } from '../constants/SMOKE_SCOPED_PROBE_DRIVE';

/**
 * A write or delete on either drive fires the handler, which writes a marker
 * into the probe store for the test to poll. The scoped drive's events must
 * arrive with the scope split off. The scoped drive is also what the
 * scopedStorageDrive test gates on, which is why both tests share this suite.
 */
export const defineStorageDriveEventSmoke = (): QPQConfig => {
  const onSmokeFileEvent: QpqFunctionRuntime = {
    basePath: __dirname,
    relativePath: '../entry/storageDrive/onSmokeFileEvent',
    functionName: 'onSmokeFileEvent',
  };

  return [
    defineStorageDrive(SMOKE_SCOPED_PROBE_DRIVE, {
      scoped: true,
      onEvent: { create: onSmokeFileEvent, delete: onSmokeFileEvent },
    }),
    defineStorageDrive(SMOKE_FILE_EVENT_DRIVE, {
      onEvent: { create: onSmokeFileEvent, delete: onSmokeFileEvent },
    }),
  ];
};
