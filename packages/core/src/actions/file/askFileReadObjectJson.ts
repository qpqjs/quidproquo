import { AskResponse } from '../../types/StorySession';
import { createActionRequester } from '../../types/utils/createActionRequester';
import { FileActionType } from './FileActionType';

export const askFileReadObjectJsonBase = createActionRequester<object>()({
  actionType: FileActionType.ReadObjectJson,
  errorTypes: [
    'InvalidStorageClass', // object is in cold storage and cannot be read directly
    'FileNotFound', // no object exists at the given filepath
    'InvalidJson', // file contents are not parseable JSON
    'InvalidScope', // scope is not a valid single path segment
  ],
  getPayload: (drive: string, filepath: string, scope?: string) => ({ drive, filepath, scope }),
});

// The stored document's shape is only known to the caller, so the base returns a bare
// object and this story casts it to what the caller declared.
export function* askFileReadObjectJson<T extends object>(drive: string, filepath: string, scope?: string): AskResponse<T> {
  return (yield* askFileReadObjectJsonBase(drive, filepath, scope)) as T;
}
