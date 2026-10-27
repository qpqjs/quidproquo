import { createActionRequester } from '../../types';
import { FileActionType } from './FileActionType';

export const askFileExists = createActionRequester<boolean>()({
  actionType: FileActionType.Exists,
  errorTypes: [
    'AccessDenied', // caller lacks permission to check existence
    'InvalidScope', // scope is not a valid single path segment
  ],
  getPayload: (drive: string, filepath: string, scope?: string) => ({ drive, filepath, scope }),
});
