---
title: defineFederatedModuleStore
description: Define a federated module store — opt a service into loading its story code from a storage drive at runtime instead of only from its bundled Lambda zips.
---

# defineFederatedModuleStore

Defines a **federated module store**: it opts a service into loading its story code as **federated modules** from a [storage drive](./storage-drive.md) at runtime, instead of running only the code statically bundled into its Lambda zips. This lets you publish new story code to the store and have running services pick it up without redeploying the infrastructure — the compute stays fixed while the behaviour is swapped underneath it. Many services can share one store bucket, each namespaced under its own prefix.

- **On AWS:** no new resource of its own — it reuses the referenced storage drive's S3 bucket. At deploy time the service's Lambdas are pointed at `s3://<bucket>/<serviceName>` via environment variables (`federatedCodeStoreUrl`, and `federatedCodeStoreRecheckMs` when set), computed by `getFederatedCodeStoreEnv` in `@qpqjs/deploy-aws`. Read access comes from the storage drive's own IAM grants — nothing extra is created. If the referenced storage drive doesn't exist, the deploy fails fast. The Lambda's module loader polls the store and falls back to bundled modules when nothing is published (unless `bundleFallback` is `false`).

```typescript
import { defineStorageDrive, defineFederatedModuleStore } from '@qpqjs/core';

export default [
  defineStorageDrive('module-store'),
  defineFederatedModuleStore('module-store'),
];
```

## Signature

```typescript
function defineFederatedModuleStore(
  storageDrive: string,
  options?: FederatedModuleStoreOptions,
): FederatedModuleStoreQPQConfigSetting;
```

## Parameters

### `storageDrive` — `string` (required)

The name of a [storage drive](./storage-drive.md) the service already declares — either an owned drive or a foreign drive (with `owner` set) to share one bucket across services. The deploy layer resolves that drive's bucket and points the Lambdas at `<bucket>/<serviceName>`, so each service's federated artifacts live under its own service prefix. There is only ever one federated module store per service (its `uniqueKey` is the fixed value `'FederatedModuleStore'`).

### `options` — `FederatedModuleStoreOptions` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `recheckMs` | `number` | `60000` | How often (in ms) a warm Lambda re-checks the store for a newly published version. Lower means faster pickup at the cost of one small S3 GET per container per interval. Set low (e.g. `5000`) while testing to see changes quickly. |
| `bundleFallback` | `boolean` | `true` | When `true` (default), the service's story code is **also** bundled into the Lambda zip, so an empty or unpublished store falls back to it. Set `false` for a **thin shell**: story code is not bundled (smaller zips) and the service runs only federated code — an unpublished store fails fast instead of silently serving stale bundled code. Thin shells require the federated remote to be published before they work. |

## Examples

```typescript
import { defineStorageDrive, defineFederatedModuleStore } from '@qpqjs/core';

export default [
  // Fast pickup while iterating, keeping the bundled code as a fallback
  defineStorageDrive('module-store'),
  defineFederatedModuleStore('module-store', { recheckMs: 5000 }),

  // Thin shell: run ONLY published federated code, no bundled fallback
  defineFederatedModuleStore('module-store', { bundleFallback: false }),
];
```

## Related

- [defineStorageDrive](./storage-drive.md) — declares the drive whose bucket backs the federated module store.
- **AWS implementation:** `getFederatedCodeStoreEnv` (Lambda environment wiring) in `@qpqjs/deploy-aws`.
