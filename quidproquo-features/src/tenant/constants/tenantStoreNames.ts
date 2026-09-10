// The tenant eventDoc collection (audit-trailed source of truth for tenant state).
export const TENANT_EVENTDOC_STORE = 'tenants';
export const TENANT_DOC_TYPE = 'tenant';

// Materialized fast-read table, synced from the eventDoc on publish.
export const TENANT_RECORD_STORE = 'tenantRecords';

// userId -> tenantIds membership links.
export const USER_TENANT_LINKS_STORE = 'userTenantLinks';

// Inline-function name for the publish -> record-store sync.
export const TENANT_ON_PUBLISH_FN = 'askTenantOnPublish';

// Inline-function name for the eventDoc `scopeResolver` hook: resolves the
// request into a typed storage scope (membership-checked tenant, or the
// caller's own personal scope when no tenant header is present).
export const TENANT_SCOPE_RESOLVER_FN = 'askTenantScopeResolver';

// Inline-function name for the websocket queue's `connectionScopeResolver`
// hook: resolves the ws Authenticate handshake into the scope stored on the
// connection (membership-checked tenant claim, or the user's personal scope).
export const TENANT_CONNECTION_SCOPE_RESOLVER_FN = 'askTenantConnectionScopeResolver';

// tenantId -> userIds membership links: the reverse of USER_TENANT_LINKS_STORE,
// maintained in lock-step so a tenant can list its members. Owner-only (the
// scope resolver never reads it).
export const TENANT_MEMBER_LINKS_STORE = 'tenantMemberLinks';
