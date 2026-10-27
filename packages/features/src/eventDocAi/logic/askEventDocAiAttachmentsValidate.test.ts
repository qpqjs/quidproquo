import { ContextActionType, ErrorTypeEnum, FileActionType, runStory, StoryError } from '@qpqjs/core';

import { describe, expect, it, vi } from 'vitest';

import { askEventDocAiAttachmentsValidate } from './askEventDocAiAttachmentsValidate';

const DRIVE = 'docs-drive';
const DOC_ID = 'doc-1';

const expectErrorType = (run: () => unknown, errorType: ErrorTypeEnum) => {
  expect(run).toThrow(StoryError);
  try {
    run();
  } catch (error) {
    expect((error as StoryError).errorType).toBe(errorType);
  }
};

// Security regression: a client-supplied attachment id is only ever a guid-shaped name looked up under the session's
// trusted document and ambient scope; a path-shaped id is refused before the drive is asked, and a missing asset is
// NotFound rather than a read elsewhere.
describe('askEventDocAiAttachmentsValidate', () => {
  it.each(['../other-doc/assets/x', '/etc/passwd', 'a/b', 'a.b', '', 'x\u0000y', 'id?x=1'])(
    'refuses the asset id %j before touching the drive',
    (assetId) => {
      const exists = vi.fn(() => true);

      expectErrorType(
        () =>
          runStory(askEventDocAiAttachmentsValidate(DRIVE, DOC_ID, [{ assetId }] as any), {
            [ContextActionType.Read]: 'TENANT#tenant-a',
            [FileActionType.Exists]: exists,
          }),
        ErrorTypeEnum.Invalid,
      );
      expect(exists).not.toHaveBeenCalled();
    },
  );

  it('looks a valid id up under the document in the ambient scope and refuses a missing one', () => {
    const calls: unknown[] = [];
    const onExists = (action: any) => {
      calls.push(action.payload);
      return false;
    };

    expectErrorType(
      () =>
        runStory(askEventDocAiAttachmentsValidate(DRIVE, DOC_ID, [{ assetId: 'asset-1' }] as any), {
          [ContextActionType.Read]: 'TENANT#tenant-a',
          [FileActionType.Exists]: onExists,
        }),
      ErrorTypeEnum.NotFound,
    );
    expect(calls[0]).toEqual({ drive: DRIVE, filepath: 'doc-1/assets/asset-1', scope: 'TENANT#tenant-a' });
  });
});
