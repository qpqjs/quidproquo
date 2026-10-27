// The package entry point. Named webpack.config.ts for historical reasons
// (package.json main/module/types all point at it); it is a plain barrel.
export * from './federation';
export * from './getQpqBundleExternals';
export * from './getResolveLoaderModules';
export * from './getWebpackBuildMode';
export * from './getWebpackConfigForQpq';
export * from './plugins';
export * from './setupWebpackQPQRuntime';
