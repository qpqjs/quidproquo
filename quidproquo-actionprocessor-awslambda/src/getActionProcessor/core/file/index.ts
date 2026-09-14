import { ActionProcessorList, ActionProcessorListResolver, DynamicModuleLoader, QPQConfig } from 'quidproquo-core';

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

export const getFileActionProcessor: ActionProcessorListResolver = async (
  qpqConfig: QPQConfig,
  dynamicModuleLoader: DynamicModuleLoader,
): Promise<ActionProcessorList> => ({
  ...(await getFileCopyActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getFileDeleteActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getFileExistsActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getFileGenerateTemporarySecureUrlActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getFileGenerateTemporaryUploadSecureUrlActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getFileIsColdStorageActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getFileListDirectoryActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getFileReadTextContentsActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getFileReadObjectJsonActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getFileWriteTextContentsActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getFileReadBinaryContentsActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getFileWriteObjectJsonActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getFileWriteBinaryContentsActionProcessor(qpqConfig, dynamicModuleLoader)),
  ...(await getFileStreamOpenActionProcessor(qpqConfig, dynamicModuleLoader)),
});
