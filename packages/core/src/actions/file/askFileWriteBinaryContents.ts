import { createActionRequester } from '../../types';
import { QPQBinaryData } from '../../types/QPQBinaryData';
import { FileActionType, StorageDriveAdvancedWriteOptions } from './FileActionType';

export const askFileWriteBinaryContents = createActionRequester<void>()({
  actionType: FileActionType.WriteBinaryContents,
  errorTypes: [
    'AccessDenied', // caller lacks permission to write the file
    'DriveNotFound', // storage drive does not exist
    'InvalidScope', // scope is not a valid single path segment
  ],
  getPayload: (
    drive: string,
    filepath: string,
    data: QPQBinaryData,
    storageDriveAdvancedWriteOptions?: StorageDriveAdvancedWriteOptions,
    scope?: string,
  ) => ({ drive, filepath, data, storageDriveAdvancedWriteOptions, scope }),
});
