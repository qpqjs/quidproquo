import { FileActionType, resolveActionResult } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { fileConfig, runFileAction } from '../../testing/fileProcessorTestHelpers';
import { getFileIsColdStorageActionProcessor } from './getFileIsColdStorageActionProcessor';

describe('getFileIsColdStorageActionProcessor', () => {
  it('always returns false because the local filesystem has no cold storage', async () => {
    const result = await runFileAction(getFileIsColdStorageActionProcessor(fileConfig), FileActionType.IsColdStorage, { filepath: 'a.txt' });

    expect(resolveActionResult(result)).toBe(false);
  });
});
