import { storageScopeContext } from 'quidproquo-core';

// The active tenant IS the ambient storage scope: scope-aware data layers (the
// eventDoc feature, the askTenant* wrappers) forward it as the File/KVS scope.
// Non-local by design - it rides the serialized session context across queue
// and service boundaries, so async work spawned inside a tenant request (a
// render job, an AI edit) lands in the same partition. The value is a TYPED
// scope (TENANT#<id> or PERSONAL#<userId> - see tenant/logic/storageScope);
// null only outside any tenant-aware request. Use askTenantReadActiveTenantId
// when the value will be treated as a tenant identity rather than a partition.
export const activeTenantContext = storageScopeContext;
