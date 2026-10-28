import { QPQJS_USER_DIRECTORY } from '@qpqjs/constants';
import {
  askTenantGenerateNewId,
  askTenantLinkMember,
  askTenantMembershipDelete,
  askTenantResolveRequest,
} from '@qpqjs/features';
import {
  askCatch,
  AskResponse,
  askUserDirectoryReadAccessToken,
  ErrorTypeEnum,
  HTTPEvent,
  validateScopeSegment,
} from 'quidproquo';

import { askSmokeAssert } from '../../../harness/assert/askSmokeAssert';

const TENANT_HEADER = 'x-qpq-tenant-id';

const isValidScopeSegment = (segment: string): boolean => {
  try {
    validateScopeSegment(segment);
    return true;
  } catch {
    return false;
  }
};

const toTenantedEvent = (tenantId?: string): HTTPEvent => ({
  path: '/security/tenant-probe',
  method: 'GET',
  query: {},
  headers: tenantId ? { [TENANT_HEADER]: tenantId } : {},
  correlation: '',
  sourceIp: '127.0.0.1',
  isBase64Encoded: false,
});

// Checklist item: tenant isolation. The request gate every tenanted route runs
// through must map the caller to exactly one scope: a tenant they are a member of
// when the header names one, their personal scope with no header, and Forbidden
// for a tenant they do not belong to, however the header is forged.
export function* askRunTenantIsolationTest(): AskResponse<void> {
  const token = yield* askUserDirectoryReadAccessToken(
    QPQJS_USER_DIRECTORY,
    false
  );
  const userId = token?.userId;
  yield* askSmokeAssert(
    !!userId,
    'the smoke run carries no caller identity to test with'
  );

  const memberTenantId = yield* askTenantGenerateNewId();
  const foreignTenantId = yield* askTenantGenerateNewId();
  yield* askTenantLinkMember(memberTenantId, userId!, [], userId!);

  try {
    const forged = yield* askCatch(
      askTenantResolveRequest(
        toTenantedEvent(foreignTenantId),
        QPQJS_USER_DIRECTORY
      )
    );
    yield* askSmokeAssert(
      !forged.success && forged.error.errorType === ErrorTypeEnum.Forbidden,
      `a header naming a tenant the caller is not a member of resolved to [${forged.success ? forged.result.scope : forged.error.errorType}], expected Forbidden`
    );

    const member = yield* askTenantResolveRequest(
      toTenantedEvent(memberTenantId),
      QPQJS_USER_DIRECTORY
    );
    yield* askSmokeAssert(
      member.scope === `TENANT#${memberTenantId}` &&
        member.tenantId === memberTenantId,
      `a member's request resolved to [${member.scope}], expected TENANT#${memberTenantId}`
    );

    // No header: the caller's own personal scope. The smoke caller is a GitHub OIDC
    // subject, whose characters a scope segment rejects, so for it the gate must
    // refuse rather than ever run the handler unscoped.
    const personal = yield* askCatch(
      askTenantResolveRequest(toTenantedEvent(), QPQJS_USER_DIRECTORY)
    );
    if (isValidScopeSegment(userId!)) {
      yield* askSmokeAssert(
        personal.success &&
          personal.result.scope === `PERSONAL#${userId}` &&
          personal.result.tenantId === null,
        `a request with no tenant header resolved to [${personal.success ? personal.result.scope : personal.error.errorType}], expected PERSONAL#${userId}`
      );
    } else {
      yield* askSmokeAssert(
        !personal.success,
        `a request with no tenant header ran for a caller whose id cannot be a scope [${personal.success ? personal.result.scope : ''}]`
      );
    }
  } finally {
    yield* askTenantMembershipDelete(userId!, memberTenantId);
  }
}
