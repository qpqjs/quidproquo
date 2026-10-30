import { createRequire } from 'module';
import { pathToFileURL } from 'url';

export type RspackModule = typeof import('@rspack/core');

// The bundler's escape hatch for the host's real `require`; undefined outside a bundle.
declare const __non_webpack_require__: NodeRequire | undefined;

// Node refuses require() of an ES module on versions before 22.12, or when the module
// graph awaits at top level; both mean "use import() instead".
const REQUIRE_ESM_ERROR_CODES = ['ERR_REQUIRE_ESM', 'ERR_REQUIRE_ASYNC_MODULE'];

// Inside a bundle `require` is the bundler's own and cannot see a layer-provided package;
// Node's real require can, and honours NODE_PATH, which is how a lambda layer is found.
const getNodeRequire = (): NodeRequire => (typeof __non_webpack_require__ === 'function' ? __non_webpack_require__ : createRequire(__filename));

// Built at run time so neither tsc (which rewrites a literal import() to require() in
// CommonJS output) nor the bundler can turn it into a require.
const importByUrl = new Function('url', 'return import(url)') as (url: string) => Promise<RspackModule>;

const isRequireEsmError = (error: unknown): boolean => REQUIRE_ESM_ERROR_CODES.includes((error as { code?: string })?.code ?? '');

const requireOrImport = async (): Promise<RspackModule> => {
  const nodeRequire = getNodeRequire();
  const entry = nodeRequire.resolve('@rspack/core');

  try {
    return nodeRequire(entry) as RspackModule;
  } catch (error) {
    // Deliberate: an ESM-only rspack cannot be required, so the same entry is imported instead; any other failure propagates.
    if (!isRequireEsmError(error)) throw error;
    return importByUrl(pathToFileURL(entry).href);
  }
};

let loading: Promise<RspackModule> | undefined;

/**
 * Loads @rspack/core, which ships as ES modules only, from CommonJS code that may be
 * bundled and running on a lambda with rspack on a layer: resolve the entry with Node's
 * require (NODE_PATH aware), require it where Node allows that, otherwise import it by
 * file URL. Loaded once per process.
 */
export const loadRspackModule = (): Promise<RspackModule> => {
  if (!loading) {
    loading = requireOrImport();
  }
  return loading;
};
