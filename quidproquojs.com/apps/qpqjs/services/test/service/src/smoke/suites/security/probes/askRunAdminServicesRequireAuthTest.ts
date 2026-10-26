import {
  askNetworkRequest,
  askOpenApiGetDocument,
  AskResponse,
} from 'quidproquo';

import { QpqjsServiceEnum } from '@qpqjs/constants';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';

type ServicesBody = { services?: string[]; logServiceName?: string };

// The admin service sits beside this one on the same api host: swap the last path
// segment (this service's name) for the admin service's.
const toAdminBaseUrl = (apiBaseUrl: string): string =>
  apiBaseUrl.replace(/\/[^/]+\/?$/, `/${QpqjsServiceEnum.Admin}`);

// Checklist item: admin settings. Every admin route must sit behind the admin user
// pool; the service list is the admin app's own data (it loads it from the log
// viewer, after login) and must not be served to an anonymous caller.
export function* askRunAdminServicesRequireAuthTest(): AskResponse<void> {
  const document = yield* askOpenApiGetDocument();
  const baseUrl = document.servers[0]?.url;
  yield* askSmokeAssert(!!baseUrl, 'document lists no servers to call');

  const response = yield* askNetworkRequest<undefined, ServicesBody>(
    'GET',
    `${toAdminBaseUrl(baseUrl)}/admin/services`
  );
  yield* askSmokeAssert(
    response.status !== 200 && !Array.isArray(response.data?.services),
    `the admin service list is served without a token [${response.status}] ${JSON.stringify(response.data).slice(0, 200)}`
  );
}
