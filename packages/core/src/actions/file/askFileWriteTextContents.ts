import { createActionRequester } from '../../logic/actions';
import { FileActionType } from './FileActionType';
import { StorageDriveAdvancedWriteOptions } from './types';

export const askFileWriteTextContents = createActionRequester<void>()({
  actionType: FileActionType.WriteTextContents,
  errorTypes: [
    'AccessDenied', // caller lacks permission to write the file
    'DriveNotFound', // storage drive does not exist
    'InvalidScope', // scope is not a valid single path segment
  ],
  getPayload: (
    drive: string,
    filepath: string,
    data: string,
    storageDriveAdvancedWriteOptions?: StorageDriveAdvancedWriteOptions,
    scope?: string,
  ) => ({ drive, filepath, data, storageDriveAdvancedWriteOptions, scope }),
});
