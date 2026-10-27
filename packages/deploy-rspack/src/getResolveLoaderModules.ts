import path from 'path';

/**
 * resolveLoader.modules entries for consumer configs: this package's compiled
 * loaders directory (so loaders like sourceMapLoader resolve by bare name)
 * followed by normal node_modules resolution.
 */
export const getResolveLoaderModules = () => [path.resolve(__dirname, 'loaders'), 'node_modules'];
