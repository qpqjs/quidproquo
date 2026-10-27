import { createActionRequester } from '../../types';
import { FileActionType } from './FileActionType';

export const askFileIsColdStorage = createActionRequester<boolean>()({
  actionType: FileActionType.IsColdStorage,
  errorTypes: [
    'AccessDenied', // caller lacks permission to read the object metadata
    'FileNotFound', // no object exists at the given filepath
    'DriveNotFound', // storage drive does not exist
    'InvalidScope', // scope is not a valid single path segment
  ],
  getPayload: (drive: string, filepath: string, scope?: string) => ({ drive, filepath, scope }),
});
