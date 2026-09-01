// Loads every service's QPQ config for an app by `require`ing each
// apps/<app>/services/<svc>/service/src/infrastructure.ts directly (its @scope
// imports resolve to built lib dist via workspace symlinks). This makes the
// caller the single source of truth for configs: no synth-to-JSON round-trip.
// Relies on TS require hooks (ts-node / rspack config eval), as go:dev:api has.
import { Nullable, QPQConfig } from 'quidproquo-core';

import path from 'path';

import { getAppServiceNames } from './getAppServiceNames';
import { requireQpqConfig } from './requireQpqConfig';

const loadServiceConfig = (root: string, appName: string, service: string): Nullable<QPQConfig> => {
  const infra = path.join(root, 'apps', appName, 'services', service, 'service', 'src', 'infrastructure');
  try {
    return requireQpqConfig(infra);
  } catch (e) {
    console.warn(`[dev-server] failed to load infrastructure for '${service}':`, e);
    return null;
  }
};

export const getAppServiceQpqConfigs = (root: string, appName: string): QPQConfig[] => {
  const serviceNames = getAppServiceNames(root, appName);

  const qpqConfigs = serviceNames.map((service) => loadServiceConfig(root, appName, service)).filter((c): c is QPQConfig => c !== null);

  // One service failing to load is survivable - the rest still run, and the
  // warning says which. EVERY service failing is not: the caller gets an empty
  // list and dies much later somewhere unrelated (an empty config list reaches
  // qpqCoreUtils as undefined and throws "Cannot read properties of undefined
  // (reading 'reduce')" from inside an express listen callback, which says
  // nothing about the missing build that actually caused it). Fail here, where
  // the cause is still in view.
  if (serviceNames.length > 0 && qpqConfigs.length === 0) {
    throw new Error(
      `No service infrastructure could be loaded for app '${appName}' (tried: ${serviceNames.join(', ')}). ` +
        `The warnings above carry the underlying errors. A MODULE_NOT_FOUND on a workspace package usually means the app's own packages have not been built - run the app's build before starting the dev server.`,
    );
  }

  return qpqConfigs;
};
