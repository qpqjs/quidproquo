import { FileActionType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { fileConfig, resolveFileProcessors } from '../../testing/fileProcessorTestHelpers';
import { getFileActionProcessor } from './index';

describe('getFileActionProcessor', () => {
  it('registers a processor for every file action it supports', async () => {
    const processors = await resolveFileProcessors(getFileActionProcessor(fileConfig));

    const expected = [
      FileActionType.ReadTextContents,
      FileActionType.WriteTextContents,
      FileActionType.ReadObjectJson,
      FileActionType.WriteObjectJson,
      FileActionType.ReadBinaryContents,
      FileActionType.WriteBinaryContents,
      FileActionType.ListDirectory,
      FileActionType.Exists,
      FileActionType.Delete,
      FileActionType.Copy,
      FileActionType.GenerateTemporarySecureUrl,
      FileActionType.GenerateTemporaryUploadSecureUrl,
      FileActionType.IsColdStorage,
      FileActionType.StreamOpen,
    ];

    expect(Object.keys(processors).sort()).toEqual([...expected].sort());
  });
});
