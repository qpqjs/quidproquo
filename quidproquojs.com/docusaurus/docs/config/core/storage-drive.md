---
title: defineStorageDrive
description: Define a storage drive — a logical file container (an S3 bucket on AWS) that file actions read from and write to.
---

# defineStorageDrive

Defines a **storage drive**: a named, logical container for files. Stories never talk to S3 or a filesystem directly — they read and write files on a drive by name using the [File action requesters](../../actions/core/file/ask-file-read-text-contents.md), and the runtime maps the drive to real storage.

- **On AWS:** deploys an S3 bucket (`QpqCoreStorageDriveConstruct` in `quidproquo-deploy-awscdk`). The bucket is versioned, blocks all public access, and is retained on stack teardown unless the service opts into destroy via `defineAwsDataStoreRemovalPolicy`.

```typescript
import { defineStorageDrive } from 'quidproquo-core';

export default [
  defineStorageDrive('user-uploads'),
];
```

## Signature

```typescript
function defineStorageDrive(
  storageDrive: string,
  options?: QPQConfigAdvancedStorageDriveSettings,
): StorageDriveQPQConfigSetting;
```

## Parameters

### `storageDrive` — `string` (required)

The name of the drive. This is the name you pass as the `drive` argument to every file action (e.g. `askFileReadTextContents('user-uploads', ...)`). It is also the drive's `uniqueKey` within the config, and on AWS it is used to derive the physical bucket name (prefixed with application/module/environment, so the same config deploys to multiple environments without collisions).

### `options` — `QPQConfigAdvancedStorageDriveSettings` (optional)

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `copyPath` | `string` | – | A local directory whose contents are uploaded ("seeded") into the drive on every deploy. Useful for static seed data. On AWS this becomes an S3 `BucketDeployment`. |
| `global` | `boolean` | `false` | Marks the drive as globally accessible across the account rather than private to the owning module. |
| `onEvent` | `StorageDriveEvents` | – | Story functions to run when files are created or deleted in the drive. See [File events](#file-events-onevent). |
| `lifecycleRules` | `StorageDriveLifecycleRule[]` | – | Rules that transition files to cheaper [storage tiers](#storagedrivetier) or delete them after a period. See [Lifecycle rules](#lifecycle-rules). |
| `encryption` | `boolean` | `false` | Enables customer-managed KMS encryption for the drive (the KMS key comes from the service's AWS config). When `false`, provider-managed encryption still applies (SSE-S3 on AWS) — this flag only controls the KMS upgrade. |
| `lockedDown` | `boolean` | `false` | Denies object reads to every principal except the owning service's runtime role (listing and bucket management are unaffected). On AWS, the service stack must pass its `serviceRole` to `QpqCoreStorageDriveConstruct`; synth throws if a `lockedDown` drive has no `serviceRole`. |
| `owner` | `CrossModuleOwner<'storageDriveName'>` | – | Declares that this drive is owned by **another** module/service. Use this to read/write a drive deployed elsewhere: the deploy grants this service IAM access to the foreign drive instead of creating a new bucket. `{ module, application, feature, environment, storageDriveName }` — all optional; unset parts default to the current service. |

## File events (`onEvent`)

```typescript
export interface StorageDriveEvents {
  create?: QpqFunctionRuntime;
  delete?: QpqFunctionRuntime;
}
```

Each handler is a `QpqFunctionRuntime` — a reference to a story entry point, usually written as a relative path string in the form `'/path/to/file::exportedFunctionName'`:

```typescript
defineStorageDrive('images', {
  onEvent: {
    create: '/entry/storageDrive/onImageCreated::onImageCreated',
    delete: '/entry/storageDrive/onImageDeleted::onImageDeleted',
  },
});
```

The handler story receives a `StorageDriveEvent` (exported from quidproquo-webserver) describing the drive and filepath that changed.

## Lifecycle rules

```typescript
export type StorageDriveLifecycleRule = {
  prefix?: string;              // only apply to files under this path prefix
  transitions?: StorageDriveTransition[]; // move files to cheaper tiers over time
  deleteAfterDays?: number;     // permanently delete files after N days
  fileSizeLessThan?: number;    // only apply to files smaller than N bytes
  fileSizeGreaterThan?: number; // only apply to files larger than N bytes
  enabled?: boolean;
};

export type StorageDriveTransition = { storageDriveTier: StorageDriveTier } & (
  | { transitionAfterDays: number }   // relative: N days after creation
  | { transitionDate: string }        // absolute: ISO date
);
```

A transition specifies **either** `transitionAfterDays` **or** `transitionDate`, never both (enforced by the type).

### `StorageDriveTier`

| Tier | Use for | AWS equivalent |
| --- | --- | --- |
| `REGULAR` | Frequently accessed data (default) | S3 Standard |
| `OCCASIONAL_ACCESS` | Infrequent access, rapid retrieval | S3 Infrequent Access |
| `SINGLE_ZONE_OCCASIONAL_ACCESS` | Infrequent access, single AZ, lower availability | S3 One Zone-IA |
| `COLD_STORAGE` | Archival; retrieval takes minutes–hours | S3 Glacier |
| `COLD_STORAGE_INSTANT_ACCESS` | Archival with millisecond access | S3 Glacier Instant Retrieval |
| `DEEP_COLD_STORAGE` | Rarely accessed; retrieval up to 12 hours; cheapest | S3 Glacier Deep Archive |
| `SMART_TIERING` | Unpredictable access patterns; auto-optimizes | S3 Intelligent Tiering |

## Examples

```typescript
import { defineStorageDrive, StorageDriveTier } from 'quidproquo-core';

export default [
  // Simple private drive
  defineStorageDrive('user-uploads'),

  // Logs: archive after 30 days, delete after a year
  defineStorageDrive('logs', {
    lifecycleRules: [
      {
        transitions: [{ storageDriveTier: StorageDriveTier.COLD_STORAGE, transitionAfterDays: 30 }],
        deleteAfterDays: 365,
      },
    ],
  }),

  // Seeded, encrypted drive with a create handler
  defineStorageDrive('templates', {
    copyPath: './seed/templates',
    encryption: true,
    onEvent: {
      create: '/entry/storageDrive/onTemplateUploaded::onTemplateUploaded',
    },
  }),

  // Use a drive owned by another service
  defineStorageDrive('shared-assets', {
    owner: { module: 'asset-service' },
  }),
];
```

## Related

- **Action requesters that use this drive:** [askFileReadTextContents](../../actions/core/file/ask-file-read-text-contents.md), [askFileWriteTextContents](../../actions/core/file/ask-file-write-text-contents.md), and the rest of the File actions (binary/JSON read & write, list, exists, delete, temporary secure URLs, streams).
- **CORS for browser access:** [defineStorageDriveCorsSettings](../webserver/storage-drive-cors-settings.md) (quidproquo-webserver) controls the allowed browser origins for direct-to-drive uploads/downloads.
- [defineFederatedModuleStore](./federated-module-store.md) — loads a service's story code from a drive declared here.
- [defineEventDocSummary](../features/event-doc-summary.md) — declares an event-document collection's asset bucket as a drive of this kind.
- **AWS tuning:** [defineAwsKmsKey](../config-aws/aws-kms-key.md) (customer-managed encryption key for the `encryption` flag) and [defineAwsDataStoreRemovalPolicy](../config-aws/aws-data-store-removal-policy.md) (retain vs destroy the bucket on teardown).
- **AWS implementation:** `QpqCoreStorageDriveConstruct` (bucket, lifecycle, KMS, IAM grants) in `quidproquo-deploy-awscdk`; file action processors in `quidproquo-actionprocessor-awslambda`.
