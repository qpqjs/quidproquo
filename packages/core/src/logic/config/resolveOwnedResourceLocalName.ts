import { CrossModuleOwner } from '../../types/CrossModuleOwner';

// The name a resource was declared under by its owner: the owner's override when it renamed
// it, else the name this service refers to it by.
export const resolveOwnedResourceLocalName = (resourceName: string, owner?: CrossModuleOwner): string => owner?.resourceNameOverride || resourceName;
