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
import { FileStorageConfig } from './types';

export * from './types';

// Main export that accepts configuration
export const getFileActionProcessor = (fileStorageConfig: FileStorageConfig): ActionProcessorListResolver => {
  return async (qpqConfig: QPQConfig, dynamicModuleLoader: DynamicModuleLoader): Promise<ActionProcessorList> => ({
    ...(await getFileReadTextContentsActionProcessor(fileStorageConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getFileWriteTextContentsActionProcessor(fileStorageConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getFileReadObjectJsonActionProcessor(fileStorageConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getFileWriteObjectJsonActionProcessor(fileStorageConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getFileReadBinaryContentsActionProcessor(fileStorageConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getFileWriteBinaryContentsActionProcessor(fileStorageConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getFileListDirectoryActionProcessor(fileStorageConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getFileExistsActionProcessor(fileStorageConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getFileDeleteActionProcessor(fileStorageConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getFileCopyActionProcessor(fileStorageConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getFileGenerateTemporarySecureUrlActionProcessor(fileStorageConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getFileGenerateTemporaryUploadSecureUrlActionProcessor(fileStorageConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getFileIsColdStorageActionProcessor(fileStorageConfig)(qpqConfig, dynamicModuleLoader)),
    ...(await getFileStreamOpenActionProcessor(fileStorageConfig)(qpqConfig, dynamicModuleLoader)),
  });
};

export * from './secureUrlUtils';
export * from './utils';
