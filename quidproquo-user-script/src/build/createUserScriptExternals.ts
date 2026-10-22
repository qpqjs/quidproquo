import { FEDERATED_SHARED_PACKAGE_NAMES } from 'quidproquo-core';

import { builtinModules } from 'module';
import type { ExternalItemFunctionData } from '@rspack/core';

type ExternalsCallback = (error?: Error, result?: string) => void;

const sharedPackageNames: readonly string[] = FEDERATED_SHARED_PACKAGE_NAMES;

const isNodeBuiltin = (request: string): boolean => request.startsWith('node:') || builtinModules.includes(request);

// A subpath of a shared package would bundle a second copy of it beside the host's.
const isSharedPackageSubpath = (request: string): boolean => sharedPackageNames.some((name) => request.startsWith(`${name}/`));

/**
 * The externals rule for a user-script build: the shared framework packages stay
 * external (the host provides them at run time), Node builtins are refused here with
 * the importing file named, because the loader would refuse them at run time anyway,
 * and everything else is bundled.
 */
export const createUserScriptExternals =
  () =>
  ({ request, contextInfo }: ExternalItemFunctionData, callback: ExternalsCallback): void => {
    if (!request) {
      return callback();
    }

    if (sharedPackageNames.includes(request)) {
      return callback(undefined, `commonjs ${request}`);
    }

    const importer = contextInfo?.issuer || 'the entry';

    if (isNodeBuiltin(request)) {
      return callback(new Error(`[${importer}] imports the Node builtin [${request}], which a user script cannot use`));
    }

    if (isSharedPackageSubpath(request)) {
      return callback(new Error(`[${importer}] imports [${request}]; import the package root instead so the host's copy is used`));
    }

    return callback();
  };
