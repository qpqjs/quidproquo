import { QPQConfig, qpqCoreUtils } from '@qpqjs/core';
import { WebEntryQPQWebServerConfigSetting } from '@qpqjs/webserver';

import { join } from 'upath';

export const getWebEntryFullPath = (qpqConfig: QPQConfig, webEntryQPQWebServerConfigSetting: WebEntryQPQWebServerConfigSetting): string => {
  return join(qpqCoreUtils.getConfigRoot(qpqConfig), webEntryQPQWebServerConfigSetting.buildPath || '');
};
