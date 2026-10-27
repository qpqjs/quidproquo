import { createActionRequester } from '../../types';
import { FileActionType } from './FileActionType';

export const askFileGenerateTemporarySecureUrl = createActionRequester<string>()({
  actionType: FileActionType.GenerateTemporarySecureUrl,
  errorTypes: [
    'ExpirationTooLong', // requested expiry exceeds max length of time possible
    'InvalidScope', // scope is not a valid single path segment
  ],
  getPayload: (drive: string, filepath: string, expirationMs: number, scope?: string) => ({ drive, filepath, expirationMs, scope }),
});
