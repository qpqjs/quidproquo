---
title: askDnsList
description: List the root domains a service has declared.
---

# askDnsList

Returns the root domains the service declared with [defineDns](../../../config/webserver/dns.md), primary first. Use it when a story needs to know which roots the service is served on; for a hostname, use [askDnsResolveHosts](./ask-dns-resolve-hosts.md).

- **Action type:** `DnsActionType.List`

```typescript
import { askDnsList } from 'quidproquo-webserver';

export function* askPrimaryRootDomain() {
  const roots = yield* askDnsList();
  return roots[0];
}
```

## Signature

```typescript
function* askDnsList(): AskResponse<string[]>;
```

Takes no arguments.

## Returns

`string[]` — the `rootDomains` of the service's [defineDns](../../../config/webserver/dns.md) config, empty when it declares none.

- **On AWS:** this does **not** query Route53. The processor reads the service's own config, so the result is exactly what was declared.

## Related

- [defineDns](../../../config/webserver/dns.md) — declares the roots this action returns.
- [askDnsResolveHosts](./ask-dns-resolve-hosts.md) — a target's host on every root.
