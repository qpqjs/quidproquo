---
title: askDnsResolveHosts
description: Resolve a host target to its hostname on every root domain the service declares.
---

# askDnsResolveHosts

Returns the hostname for a `{ subdomain?, service? }` target on every root the service declared with [defineDns](../../../config/webserver/dns.md), primary first. The processor runs the app's [domain resolver](../../../domains.md) (loaded once through the dynamic module loader), so any target resolves, not only ones the config declares.

- **Action type:** `DnsActionType.ResolveHosts`

```typescript
import { askDnsResolveHosts } from 'quidproquo-webserver';

export function* askPrimarySiteUrl() {
  const [siteHost] = yield* askDnsResolveHosts();
  return `https://${siteHost}`;
}

export function* askApiHosts() {
  return yield* askDnsResolveHosts({ subdomain: 'api' });
}
```

## Signature

```typescript
function* askDnsResolveHosts(target?: DomainTarget): AskResponse<string[]>;
```

### `target` — `DomainTarget` (optional)

`{ subdomain?: string; service?: string }`. Omitted means the site root.

## Returns

`string[]` — one host per root, primary first; empty when the service declares no domain.

## Related

- [defineDns](../../../config/webserver/dns.md) — the roots resolved against.
- [askDnsList](./ask-dns-list.md) — the root list itself.
