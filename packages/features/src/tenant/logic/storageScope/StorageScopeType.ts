// Typed storage scopes: every tenant-aware request runs under exactly one of
// these two partitions - a tenant the user belongs to, or the user's own
// personal partition. The type prefix keeps the two namespaces disjoint by
// construction, so code that treats the ambient scope as a tenant identity
// (registry lookups, branding) can discriminate without hitting storage.
//
// The prefix is part of the scope segment itself; the '@@QPQSCOPE@@' kvs
// delimiter is composed downstream by the core scope gates, giving keys like
// 'PERSONAL#<userId>@@QPQSCOPE@@<key>'.
export enum StorageScopeType {
  tenant = 'tenant',
  personal = 'personal',
}
