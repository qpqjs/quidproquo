import { AskResponse, askStorageScopeRead } from 'quidproquo-core';

import { EventDocOnPublishInput } from '../../eventDoc/models';
import { askTenantRecordUpsert } from '../data/askTenantRecordUpsert';
import { TenantDocument } from '../models/TenantDocument';
import { TenantRecord } from '../models/TenantRecord';
import { TenantStatus } from '../models/TenantStatus';

// The tenant collection's onPublish inline function: materialize the tenant record from
// the folded state the append hands over (no re-read, no re-fold — the state is
// snapshot-seeded and latest-shaped). Idempotent by construction (a plain upsert of the
// fold result), so publish retries and repair re-runs are safe.
export function* askTenantOnPublish(input: EventDocOnPublishInput): AskResponse<void> {
  const doc = input.state as TenantDocument;

  // The publish request's ambient scope IS the doc's home partition (inline
  // functions run within the caller's story, so the scope context rides along).
  // Recorded so the registry can presign the doc's blobs for cross-scope readers.
  const scope = yield* askStorageScopeRead();

  const record: TenantRecord = {
    tenantId: input.docId,
    name: input.summary.name,
    brandColors: doc.brandColors,
    logo: doc.logo,
    displayName: doc.displayName,
    scope: scope ?? undefined,
    createdAt: input.summary.createdAt,
    updatedAt: input.summary.updatedAt,
    createdByUserId: input.summary.createdBy,
    status: input.summary.deletedAt ? TenantStatus.deleted : TenantStatus.active,
  };

  yield* askTenantRecordUpsert(record);
}
