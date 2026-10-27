import { createActionRequester } from '../../types';
import { FileActionType } from './FileActionType';

export type FileGenerateTemporaryUploadSecureUrlAdvancedOptions = {
  contentType?: string;
  // Content-Disposition to bake into the upload so the stored object serves with it (e.g. 'inline'
  // so a PDF previews in an <iframe> instead of force-downloading). On S3 it is signed into the PUT
  // (the client must send the matching header); the dev store persists it as sidecar metadata.
  contentDisposition?: string;
  // maxSizeBytes?: number;
};

export const askFileGenerateTemporaryUploadSecureUrl = createActionRequester<string>()({
  actionType: FileActionType.GenerateTemporaryUploadSecureUrl,
  errorTypes: [
    'ExpirationTooLong', // requested expiry exceeds max length of time possible
    'InvalidScope', // scope is not a valid single path segment
  ],
  getPayload: (
    drive: string,
    filepath: string,
    expirationMs: number,
    advancedOptions?: FileGenerateTemporaryUploadSecureUrlAdvancedOptions,
    scope?: string,
  ) => ({
    drive,
    filepath,
    expirationMs,
    contentType: advancedOptions?.contentType,
    contentDisposition: advancedOptions?.contentDisposition,
    // maxSizeBytes: advancedOptions?.maxSizeBytes,
    scope,
  }),
});
