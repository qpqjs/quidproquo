import { TenantId } from '../models/TenantId';
import { isTenantId } from './isTenantId';

/** Brand a tenant id the system minted or stored, throwing on a malformed one. Request edges use askTenantIdParse instead. */
export const toTenantId = (value: string): TenantId => {
  if (!isTenantId(value)) {
    throw new Error(`Invalid tenant id: '${value}'`);
  }

  return value;
};
