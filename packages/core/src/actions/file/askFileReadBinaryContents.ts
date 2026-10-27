import { createActionRequester } from '../../types';
import { QPQBinaryData } from '../../types/QPQBinaryData';
import { FileActionType } from './FileActionType';

export const askFileReadBinaryContents = createActionRequester<QPQBinaryData>()({
  actionType: FileActionType.ReadBinaryContents,
  errorTypes: [
    'InvalidStorageClass', // object is in cold storage and cannot be read directly
    'FileNotFound', // no object exists at the given filepath
    'InvalidScope', // scope is not a valid single path segment
  ],
  getPayload: (drive: string, filepath: string, scope?: string) => ({ drive, filepath, scope }),
});
