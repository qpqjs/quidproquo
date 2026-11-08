import { CrossModuleOwner, QPQConfig, qpqCoreUtils } from '@qpqjs/core';

import { OwnedStoreLocation } from './OwnedStoreLocation';

// Where the dev server keeps a named resource's local stand-in. The AWS runtime resolves the
// same owner the same way for its aliases, user pools and parameter keys; this is the local
// equivalent, so a cross-module owner redirects to the owning service's file here too.
export const resolveOwnedStoreLocation = (resourceName: string, owner: CrossModuleOwner | undefined, qpqConfig: QPQConfig): OwnedStoreLocation => ({
  serviceName: qpqCoreUtils.resolveOwnerModuleName(owner, qpqConfig),
  key: qpqCoreUtils.resolveOwnedResourceLocalName(resourceName, owner),
});
