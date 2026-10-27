import { QPQConfig, qpqCoreUtils, StorageDriveQPQConfigSetting } from 'quidproquo-core';

import { join } from 'upath';

export const getStorageDriveUploadFullPath = (qpqConfig: QPQConfig, storageDriveConfig: StorageDriveQPQConfigSetting): string => {
  return join(qpqCoreUtils.getConfigRoot(qpqConfig), storageDriveConfig.copyPath || '');
};
