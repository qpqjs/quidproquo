import { QPQConfig, qpqCoreUtils } from 'quidproquo-core';
import { WebEntryQPQWebServerConfigSetting } from 'quidproquo-webserver';

import { join } from 'upath';

export const getWebEntryFullPath = (qpqConfig: QPQConfig, webEntryQPQWebServerConfigSetting: WebEntryQPQWebServerConfigSetting): string => {
  return join(qpqCoreUtils.getConfigRoot(qpqConfig), webEntryQPQWebServerConfigSetting.buildPath || '');
};
