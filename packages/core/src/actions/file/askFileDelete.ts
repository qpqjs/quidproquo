import { createActionRequester } from '../../types';
import { FileActionType } from './FileActionType';

export const askFileDelete = createActionRequester<string[]>()({
  actionType: FileActionType.Delete,
  errorTypes: [
    'AccessDenied', // caller lacks permission to delete
    'DriveNotFound', // storage drive does not exist
    'InvalidScope', // scope is not a valid single path segment
  ],
  getPayload: (drive: string, filepaths: string[], scope?: string) => ({ drive, filepaths, scope }),
});
