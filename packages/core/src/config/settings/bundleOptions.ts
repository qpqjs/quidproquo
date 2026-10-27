import { QPQConfigSetting, QPQCoreConfigSettingType } from '../QPQConfig';

// Regex fields are plain regex-source strings (not RegExp) — QPQ configs must
// survive JSON serialization. Bundlers compile them with `new RegExp(...)`.

export interface BundleIgnoreModule {
  // Request to drop from the bundle, e.g. '^original-fs$'.
  resource: string;

  // Only drop when required from a module matching this, e.g. 'adm-zip'.
  context?: string;
}

export interface BundleIgnoreWarning {
  module?: string;
  message?: string;
}

export interface BackendBundleOptions {
  // Packages to require() at runtime instead of bundling. Prefer declaring
  // layer-provided packages on the layer itself (`ApiLayer.modules`) — this is
  // the escape hatch for non-layer cases.
  externals?: string[];

  // Optional requires inside dependencies that should resolve to nothing.
  ignoreModules?: BundleIgnoreModule[];

  // Known-noisy build warnings to suppress.
  ignoreWarnings?: BundleIgnoreWarning[];
}

export interface BackendBundleOptionsQPQConfigSetting extends QPQConfigSetting {
  externals: string[];
  ignoreModules: BundleIgnoreModule[];
  ignoreWarnings: BundleIgnoreWarning[];
}

export const defineBackendBundleOptions = (options: BackendBundleOptions): BackendBundleOptionsQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.backendBundleOptions,
  uniqueKey: JSON.stringify(options),

  externals: options.externals ?? [],
  ignoreModules: options.ignoreModules ?? [],
  ignoreWarnings: options.ignoreWarnings ?? [],
});

// Grows on demand — fonts/images are already default-on in the views build.
export interface FrontendBundleOptions {
  // Substring-matched against the hoisted root dependency names; matches are
  // shared as module-federation singletons. react/react-dom/react-ish deps and
  // quidproquo-web* are always singletons — this adds app-stack ones (e.g.
  // 'chakra', 'zod') without baking package names into the bundler.
  sharedSingletons?: string[];
}

export interface FrontendBundleOptionsQPQConfigSetting extends QPQConfigSetting {
  sharedSingletons: string[];
}

export const defineFrontendBundleOptions = (options: FrontendBundleOptions): FrontendBundleOptionsQPQConfigSetting => ({
  configSettingType: QPQCoreConfigSettingType.frontendBundleOptions,
  uniqueKey: JSON.stringify(options),

  sharedSingletons: options.sharedSingletons ?? [],
});
