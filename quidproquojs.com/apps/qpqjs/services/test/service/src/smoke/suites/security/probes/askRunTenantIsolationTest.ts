import { QPQJS_USER_DIRECTORY } from '@qpqjs/constants';
import {
  askTenantGenerateNewId,
  askTenantLinkMember,
  askTenantMembershipDelete,
  askTenantResolveRequest,
  DEFAULT_TENANT_HEADER_NAME,
} from '@qpqjs/features';
import { askCatch, AskResponse, askThrowError, askUserDirectoryReadAccessToken, ErrorTypeEnum, HTTPEvent } from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';

const toTenantedEvent = (tenantId?: string): HTTPEvent => ({
  path: '/security/tenant-probe',
  method: 'GET',
  query: {},
  headers: tenantId ? { [DEFAULT_TENANT_HEADER_NAME]: tenantId } : {},
  correlation: '',
  sourceIp: '127.0.0.1',
  isBase64Encoded: false,
});

function* askCheckTenantResolution(memberTenantId: string, foreignTenantId: string): AskResponse<void> {
  const forged = yield* askCatch(askTenantResolveRequest(toTenantedEvent(foreignTenantId), QPQJS_USER_DIRECTORY));
  yield* askSmokeAssert(
    !forged.success && forged.error.errorType === ErrorTypeEnum.Forbidden,
    `a header naming a tenant the caller is not a member of resolved to [${forged.success ? forged.result.scope : forged.error.errorType}], expected Forbidden`,
  );

  const member = yield* askTenantResolveRequest(toTenantedEvent(memberTenantId), QPQJS_USER_DIRECTORY);
  yield* askSmokeAssert(
    member.scope === `TENANT#${memberTenantId}` && member.tenantId === memberTenantId,
    `a member's request resolved to [${member.scope}], expected TENANT#${memberTenantId}`,
  );

  // No header: the caller's own personal scope. The smoke caller's id is its GitHub OIDC
  // subject (`repo:owner/name:...`), which a scope segment rejects, so from here the gate
  // can only be seen refusing rather than running the handler unscoped. The happy path,
  // no header mapping to PERSONAL#<userId>, is covered by the askTenantResolveRequestScope
  // unit test in @qpqjs/features, since no deployed caller can exercise it.
  const personal = yield* askCatch(askTenantResolveRequest(toTenantedEvent(), QPQJS_USER_DIRECTORY));
  yield* askSmokeAssert(
    !personal.success,
    `a request with no tenant header ran for a caller whose id cannot be a scope [${personal.success ? personal.result.scope : ''}]`,
  );
}

// Checklist item: tenant isolation. The request gate every tenanted route runs
// through must map the caller to exactly one scope: a tenant they are a member of
// when the header names one, Forbidden for a tenant they do not belong to however
// the header is forged, and never an unscoped run when the header is absent.
export function* askRunTenantIsolationTest(): AskResponse<void> {
  const token = yield* askUserDirectoryReadAccessToken(QPQJS_USER_DIRECTORY, false);
  const userId = token?.userId;
  yield* askSmokeAssert(!!userId, 'the smoke run carries no caller identity to test with');

  const memberTenantId = yield* askTenantGenerateNewId();
  const foreignTenantId = yield* askTenantGenerateNewId();
  yield* askTenantLinkMember(memberTenantId, userId!, [], userId!);

  // A failed assertion ends the story through an error action, which never reaches a `finally` block,
  // so the membership row is removed through askCatch's finally story and the failure rethrown.
  const checks = yield* askCatch(askCheckTenantResolution(memberTenantId, foreignTenantId), askTenantMembershipDelete(userId!, memberTenantId));
  if (!checks.success) {
    return yield* askThrowError(checks.error.errorType, checks.error.errorText, checks.error.errorStack);
  }
}
