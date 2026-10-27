import { AskResponse } from 'quidproquo-core';

import { askEventDocGenerateNewId } from '../../eventDoc/logic/askEventDocGenerateNewId';
import { TenantId } from '../models/TenantId';
import { toTenantId } from './toTenantId';

/** A new tenant's id: a document id, since the tenant is its own eventDoc, branded as a TenantId. */
export function* askTenantGenerateNewId(): AskResponse<TenantId> {
  return toTenantId(yield* askEventDocGenerateNewId());
}
