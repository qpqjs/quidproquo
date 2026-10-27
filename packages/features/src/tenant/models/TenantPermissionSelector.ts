/**
 * Which resources a grant covers. `ids` matches only a requirement's resourceId and
 * `resourceKinds` only its resourceKind: the two are separate namespaces, since nothing
 * guarantees a domain's ids and kind codes are disjoint strings.
 */
export type TenantPermissionSelector = { kind: 'all' } | { kind: 'ids'; ids: string[] } | { kind: 'resourceKinds'; kinds: string[] };
