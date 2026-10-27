import { Brand } from 'quidproquo-core';

/** A tenant's identity: its document id, branded so it cannot be confused with a user id or a scope string. Made with `toTenantId` or `askTenantIdParse`. */
export type TenantId = Brand<string, 'TenantId'>;
