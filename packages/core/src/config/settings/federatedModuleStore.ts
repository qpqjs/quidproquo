import { QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

// Opts a service into loading its story code as federated modules from a storage
// drive, instead of running only the code statically bundled into its lambda zips.
//
// `storageDrive` names a storage drive the service already declares (owned, or a
// foreign drive with `owner` set for a shared bucket). The deploy layer resolves
// that drive's bucket and points the lambdas at `<bucket>/<serviceName>`, so many
// services can share one bucket with each service's artifacts under its own prefix.
// Read access comes from the storage drive's own grants — nothing extra is created.
export interface FederatedModuleStoreOptions {
  // How often (ms) a warm lambda re-checks the store for a newly published version.
  // Lower = faster pickup at the cost of one small S3 GET per container per interval.
  // Defaults to 60000. Set low (e.g. 5000) while testing to see changes quickly.
  recheckMs?: number;

  // When true (default), the service's story code is ALSO bundled into the lambda
  // zip, so an empty/unpublished store falls back to it. Set false for "thin shells":
  // the story code is NOT bundled (smaller zips) and the service runs ONLY federated
  // code - an unpublished store fails fast instead of silently serving stale bundled
  // code. Thin shells REQUIRE publishing the federated remote before they work.
  bundleFallback?: boolean;
}

export interface FederatedModuleStoreQPQConfigSetting extends QPQConfigSetting {
  storageDrive: string;
  recheckMs?: number;
  bundleFallback: boolean;
}

export const defineFederatedModuleStore = (storageDrive: string, options?: FederatedModuleStoreOptions): FederatedModuleStoreQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.federatedModuleStore,
  uniqueKey: 'FederatedModuleStore',

  storageDrive,
  recheckMs: options?.recheckMs,
  bundleFallback: options?.bundleFallback ?? true,
});
