import { CrossModuleOwner, QPQConfig, qpqCoreUtils } from '@qpqjs/core';

export type OwnedStoreLocation = {
  // The service whose local store holds the resource: its owner's, or this one.
  serviceName: string;
  // The key inside that store: the owner's override when it renamed the resource.
  key: string;
};

// Where the dev server keeps a named resource's local stand-in. The AWS runtime resolves the
// same owner the same way for its aliases, user pools and parameter keys; this is the local
// equivalent, so a cross-module owner redirects to the owning service's file here too.
export const resolveOwnedStoreLocation = (resourceName: string, owner: CrossModuleOwner | undefined, qpqConfig: QPQConfig): OwnedStoreLocation => ({
  serviceName: qpqCoreUtils.resolveOwnerModuleName(owner, qpqConfig),
  key: qpqCoreUtils.resolveOwnedResourceLocalName(resourceName, owner),
});
