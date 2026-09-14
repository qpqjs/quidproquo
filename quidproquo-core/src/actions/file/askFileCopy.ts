import { createActionRequester } from '../../types';
import { FileActionType } from './FileActionType';

/**
 * Copies one object to another path, possibly on another drive, without the bytes crossing the story (an S3
 * server-side copy on lambda, a filesystem copy locally). The stored content type and content disposition come
 * along with it. One `scope` applies to both sides: a copy never crosses a storage scope.
 */
export const askFileCopy = createActionRequester<void>()({
  actionType: FileActionType.Copy,
  errorTypes: [
    'AccessDenied', // caller lacks permission to read the source or write the target
    'DriveNotFound', // the source or target storage drive does not exist
    'FileNotFound', // no object exists at the source filepath
    'InvalidScope', // scope is not a valid single path segment
  ],
  getPayload: (sourceDrive: string, sourceFilepath: string, targetDrive: string, targetFilepath: string, scope?: string) => ({
    sourceDrive,
    sourceFilepath,
    targetDrive,
    targetFilepath,
    scope,
  }),
});
