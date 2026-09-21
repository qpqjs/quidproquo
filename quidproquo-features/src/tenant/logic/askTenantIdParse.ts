import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { TenantId } from '../models/TenantId';
import { isTenantId } from './isTenantId';

/** Brand a tenant id arriving from a request (header, path param, ws claim); BadRequest on a malformed one. */
export function* askTenantIdParse(value: string): AskResponse<TenantId> {
  if (!isTenantId(value)) {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, `Invalid tenant id: '${value}'`);
  }

  return value;
}
