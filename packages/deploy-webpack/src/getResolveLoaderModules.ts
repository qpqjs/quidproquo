import path from 'path';

/**
 * resolveLoader.modules entries for consumer configs: this package's compiled
 * loaders directory followed by normal node_modules resolution. The webpack
 * flavour ships no local loaders (it uses the npm source-map-loader), so the
 * first entry may not exist; webpack treats a missing directory as a no-op.
 * Kept for API parity with quidproquo-deploy-rspack.
 */
export const getResolveLoaderModules = () => [path.resolve(__dirname, 'loaders'), 'node_modules'];
