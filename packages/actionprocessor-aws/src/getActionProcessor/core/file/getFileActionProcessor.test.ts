import { defineAwsServiceAccountInfo } from '@qpqjs/config-aws';
import { buildTestQpqConfig, noopDynamicModuleLoader } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { getFileActionProcessor } from './getFileActionProcessor';
import { getFileCopyActionProcessor } from './getFileCopyActionProcessor';
import { getFileDeleteActionProcessor } from './getFileDeleteActionProcessor';
import { getFileExistsActionProcessor } from './getFileExistsActionProcessor';
import { getFileGenerateTemporarySecureUrlActionProcessor } from './getFileGenerateTemporarySecureUrlActionProcessor';
import { getFileGenerateTemporaryUploadSecureUrlActionProcessor } from './getFileGenerateTemporaryUploadSecureUrlActionProcessor';
import { getFileIsColdStorageActionProcessor } from './getFileIsColdStorageActionProcessor';
import { getFileListDirectoryActionProcessor } from './getFileListDirectoryActionProcessor';
import { getFileReadBinaryContentsActionProcessor } from './getFileReadBinaryContentsActionProcessor';
import { getFileReadObjectJsonActionProcessor } from './getFileReadObjectJsonActionProcessor';
import { getFileReadTextContentsActionProcessor } from './getFileReadTextContentsActionProcessor';
import { getFileStreamOpenActionProcessor } from './getFileStreamOpenActionProcessor';
import { getFileWriteBinaryContentsActionProcessor } from './getFileWriteBinaryContentsActionProcessor';
import { getFileWriteObjectJsonActionProcessor } from './getFileWriteObjectJsonActionProcessor';
import { getFileWriteTextContentsActionProcessor } from './getFileWriteTextContentsActionProcessor';

const qpqConfig = buildTestQpqConfig([defineAwsServiceAccountInfo('111', 'eu-west-1')]);
const dynamicModuleLoader = noopDynamicModuleLoader;

// The composer is the sum of its parts: every processor each part registers is reachable
// through it, and none is shadowed by a later part.
describe('getFileActionProcessor', () => {
  it('composes every processor of its parts', async () => {
    const parts = await Promise.all([
      getFileCopyActionProcessor(qpqConfig, dynamicModuleLoader),
      getFileDeleteActionProcessor(qpqConfig, dynamicModuleLoader),
      getFileExistsActionProcessor(qpqConfig, dynamicModuleLoader),
      getFileGenerateTemporarySecureUrlActionProcessor(qpqConfig, dynamicModuleLoader),
      getFileGenerateTemporaryUploadSecureUrlActionProcessor(qpqConfig, dynamicModuleLoader),
      getFileIsColdStorageActionProcessor(qpqConfig, dynamicModuleLoader),
      getFileListDirectoryActionProcessor(qpqConfig, dynamicModuleLoader),
      getFileReadTextContentsActionProcessor(qpqConfig, dynamicModuleLoader),
      getFileReadObjectJsonActionProcessor(qpqConfig, dynamicModuleLoader),
      getFileWriteTextContentsActionProcessor(qpqConfig, dynamicModuleLoader),
      getFileReadBinaryContentsActionProcessor(qpqConfig, dynamicModuleLoader),
      getFileWriteObjectJsonActionProcessor(qpqConfig, dynamicModuleLoader),
      getFileWriteBinaryContentsActionProcessor(qpqConfig, dynamicModuleLoader),
      getFileStreamOpenActionProcessor(qpqConfig, dynamicModuleLoader),
    ]);
    const expected = parts.flatMap((part) => Object.keys(part));

    const composed = await getFileActionProcessor(qpqConfig, dynamicModuleLoader);

    expect(Object.keys(composed).sort()).toEqual([...new Set(expected)].sort());
    expect(expected.length).toBe(new Set(expected).size);
  });
});
