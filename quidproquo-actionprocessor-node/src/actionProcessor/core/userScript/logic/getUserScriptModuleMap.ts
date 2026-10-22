import * as quidproquoCore from 'quidproquo-core';
import { FEDERATED_SHARED_PACKAGE_NAMES } from 'quidproquo-core';
import * as quidproquoWebserver from 'quidproquo-webserver';

import { UserScriptModuleMap } from './UserScriptModuleMap';

const sharedPackages: Record<(typeof FEDERATED_SHARED_PACKAGE_NAMES)[number], unknown> = {
  'quidproquo-core': quidproquoCore,
  'quidproquo-webserver': quidproquoWebserver,
};

/**
 * The host's own instances of the shared framework packages, keyed by specifier, so a
 * user script resolves the same modules the runtime is built from.
 */
export const getUserScriptModuleMap = (): UserScriptModuleMap =>
  Object.fromEntries(FEDERATED_SHARED_PACKAGE_NAMES.map((name) => [name, sharedPackages[name]]));
