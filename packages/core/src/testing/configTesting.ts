import { defineApplicationModule } from '../config';
import { QPQConfig, QPQConfigItem } from '../config';

// ─── Config testing helper ───────────────────────────────────────────────────
//
// Almost every qpqCoreUtils selector needs app context — an appName setting (for
// application/environment/feature) and a moduleName setting (for the service) — before
// it can flatten, filter by ownership, or build fully-qualified resource names. Repeating
// that boilerplate in each test buries the setting under test, so `buildTestQpqConfig`
// prepends a sensible default application module and lets the caller drop in just the
// settings the assertion is about.
//
//   const config = buildTestQpqConfig([defineSecret('apiKey')]);
//   const config = buildTestQpqConfig([...], { environment: 'production', feature: 'beta' });

export interface TestQpqConfigAppOptions {
  applicationName?: string;
  moduleName?: string;
  environment?: string;
  configRoot?: string;
  apiBuildPath?: string;
  feature?: string;
}

// Builds a QPQConfig from `settings`, prepending a default application module so context-
// dependent selectors work. Any field of that module can be overridden via `appOptions`.
export const buildTestQpqConfig = (settings: QPQConfigItem[] = [], appOptions: TestQpqConfigAppOptions = {}): QPQConfig => {
  const {
    applicationName = 'test-app',
    moduleName = 'test-module',
    environment = 'development',
    configRoot = './',
    apiBuildPath = './build',
    feature,
  } = appOptions;

  return [...defineApplicationModule(applicationName, moduleName, environment, configRoot, apiBuildPath, feature), ...settings];
};
