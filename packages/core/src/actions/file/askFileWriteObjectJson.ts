import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { FileActionType, StorageDriveAdvancedWriteOptions } from './FileActionType';

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
export function* askFileWriteObjectJson<T extends object>(
  drive: string,
  filepath: string,
  data: T,
  storageDriveAdvancedWriteOptions?: StorageDriveAdvancedWriteOptions,
  scope?: string,
): AskResponse<void> {
  return yield* askFileWriteObjectJsonBase(drive, filepath, data, storageDriveAdvancedWriteOptions, scope);
}
