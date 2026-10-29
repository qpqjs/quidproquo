import { QpqFunctionRuntime } from '../../types';
import { getUniqueKeyFromQpqFunctionRuntime } from '../../utils';
import { QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

export interface BundleEntriesQPQConfigSetting extends QPQConfigSetting {
  runtimes: QpqFunctionRuntime[];
}

/**
 * Registers runtimes that are only ever reached through the dynamic module loader (a
 * plugin's guards, hooks or callbacks) so the bundler builds them. Anything not in
 * getAllSrcEntries is silently missing from the deployed bundle.
 */
export const defineBundleEntries = (runtimes: QpqFunctionRuntime[]): BundleEntriesQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.bundleEntries,
  uniqueKey: runtimes.map(getUniqueKeyFromQpqFunctionRuntime).join('|'),

  runtimes,
});
