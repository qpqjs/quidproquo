import { createActionRequester } from '../../logic/actions/createActionRequester';
import { AskResponse } from '../../types/StorySession';
import { FileActionType } from './FileActionType';
import { StorageDriveAdvancedWriteOptions } from './types';

export const askFileWriteObjectJsonBase = createActionRequester<void>()({
  actionType: FileActionType.WriteObjectJson,
  errorTypes: [
    'AccessDenied', // caller lacks permission to write the file
    'DriveNotFound', // storage drive does not exist
    'InvalidScope', // scope is not a valid single path segment
  ],
  getPayload: (
    drive: string,
    filepath: string,
    data: object,
    storageDriveAdvancedWriteOptions?: StorageDriveAdvancedWriteOptions,
    scope?: string,
  ) => ({ drive, filepath, data, storageDriveAdvancedWriteOptions, scope }),
});

// Generic so callers can pin the document shape they are writing at the call site.
function* askFileWriteObjectJsonTyped<T extends object>(
  drive: string,
  filepath: string,
  data: T,
  storageDriveAdvancedWriteOptions?: StorageDriveAdvancedWriteOptions,
  scope?: string,
): AskResponse<void> {
  return yield* askFileWriteObjectJsonBase(drive, filepath, data, storageDriveAdvancedWriteOptions, scope);
}

/** Carries the base requester's `errorType` catalog so callers can match on it. */
export const askFileWriteObjectJson = Object.assign(askFileWriteObjectJsonTyped, { errorType: askFileWriteObjectJsonBase.errorType });
