import { AskResponse } from 'quidproquo-core';

import { EventDocOnPublishInput } from '../../eventDoc/models';
import { askTenantRecordUpsert } from '../data/askTenantRecordUpsert';
import { TenantDocument } from '../models/TenantDocument';
import { TenantRecord } from '../models/TenantRecord';
import { TenantStatus } from '../models/TenantStatus';
import { toTenantId } from './toTenantId';

/**
 * The tenant collection's onPublish inline function: materialize the tenant record from the
 * folded state the append hands over (no re-read, no re-fold). A plain upsert of the fold
 * result, so publish retries and repair re-runs are safe.
 */
export function* askTenantOnPublish(input: EventDocOnPublishInput): AskResponse<void> {
  const doc = input.state as TenantDocument;

  const record: TenantRecord = {
    tenantId: toTenantId(input.docId),
    name: input.summary.name,
    brandColors: doc.brandColors,
    logo: doc.logo,
    displayName: doc.displayName,
    createdAt: input.summary.createdAt,
    updatedAt: input.summary.updatedAt,
    createdByUserId: input.summary.createdBy,
    status: input.summary.deletedAt ? TenantStatus.deleted : TenantStatus.active,
  };

  yield* askTenantRecordUpsert(record);
}
