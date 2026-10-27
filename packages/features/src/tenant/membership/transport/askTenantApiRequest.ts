import { AskResponse, askThrowError, ErrorTypeEnum, HTTPMethod } from 'quidproquo-core';
import { askApiRequest } from 'quidproquo-webserver';

import { TenantClientTarget } from '../../models/TenantClientTarget';
import { tenantMyTenantsEndpoint } from '../constants/tenantMyTenantsEndpoint';

/** One call to a tenant route; a non-2xx status becomes a thrown error carrying the server's message where it sent one. */
export function* askTenantApiRequest<TBody, TResponse>(
  target: TenantClientTarget,
  method: HTTPMethod,
  path: string,
  body?: TBody,
): AskResponse<TResponse> {
  const response = yield* askApiRequest<TBody, TResponse>(target.service, method, tenantMyTenantsEndpoint(target, path), body ? { body } : undefined);

  if (response.status < 200 || response.status >= 300) {
    const message = (response.data as { message?: string } | undefined)?.message;
    return yield* askThrowError(ErrorTypeEnum.GenericError, message ?? `Tenant request failed (${response.status})`);
  }

  return response.data;
}
