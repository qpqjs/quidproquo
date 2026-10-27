import { Nullable, QPQConfig, qpqCoreUtils } from 'quidproquo-core';

import { QPQWebServerConfigSettingType } from '../../config/QPQConfig';
import { StorageDriveCorsSettingsQPQWebServerConfigSetting } from '../../config/settings/storageDriveCorsSettings';

/** The `defineStorageDriveCorsSettings` entry for a drive, null when it has none. */
export const getStorageDriveCorsSettingsByName = (
  qpqConfig: QPQConfig,
  storageDriveName: string,
): Nullable<StorageDriveCorsSettingsQPQWebServerConfigSetting> =>
  qpqCoreUtils
    .getConfigSettings<StorageDriveCorsSettingsQPQWebServerConfigSetting>(qpqConfig, QPQWebServerConfigSettingType.StorageDriveCorsSettings)
    .find((setting) => setting.storageDriveName === storageDriveName) ?? null;
