import { AskResponse } from '@qpqjs/core';
import { HTTPEvent } from '@qpqjs/webserver';

import { askTenantResolveRequest } from './askTenantResolveRequest';

/** The request's typed storage scope alone; see askTenantResolveRequest for the gate it applies. */
export function* askTenantResolveRequestScope(event: HTTPEvent, userDirectoryName?: string): AskResponse<string> {
  const { scope } = yield* askTenantResolveRequest(event, userDirectoryName);

  return scope;
}
