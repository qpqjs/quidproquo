import { AskResponse, askThrowError, ErrorTypeEnum } from '@qpqjs/core';

import { eventDocPermission } from '../../eventDoc/constants/eventDocPermissions';
import { parseEventDocHeadMovedTopic } from '../../eventDoc/logic/parseEventDocHeadMovedTopic';
import { EventDocPermissionAction } from '../../eventDoc/types/EventDocPermissionAction';
import { WebSocketQueueTopicAuthoriseInput } from '../../webSocketQueue/types/WebSocketQueueTopicAuthoriseInput';
import { buildTenantPermissionRequirement } from './roles/buildTenantPermissionRequirement';
import { askTenantMemberHasPermission } from './askTenantMemberHasPermission';
import { getTenantIdFromScope } from './storageScope';

/**
 * The inline-function implementation behind TENANT_TOPIC_AUTHORISER_FN: a websocket subscribe is as strict as a read.
 * Only event doc head-moved topics are known; inside a tenant the connection's user must hold `eventDoc:<store>:read`
 * there. A personal scope is the user's own (the queue stored it from a validated handshake) and runs ungated. An
 * unscoped or anonymous connection is refused.
 */
export function* askTenantTopicAuthoriser(input: WebSocketQueueTopicAuthoriseInput): AskResponse<void> {
  const parsed = parseEventDocHeadMovedTopic(input.topic);
  if (!parsed) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, `Unknown topic: ${input.topic}`);
  }

  if (!input.scope || !input.userId) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, 'Subscriptions need an authenticated, scoped connection.');
  }

  const tenantId = getTenantIdFromScope(input.scope);
  if (!tenantId) {
    return;
  }

  const permission = eventDocPermission(parsed.storeName, EventDocPermissionAction.read);
  const allowed = yield* askTenantMemberHasPermission(tenantId, input.userId, buildTenantPermissionRequirement(permission));

  if (!allowed) {
    return yield* askThrowError(ErrorTypeEnum.Forbidden, `Missing permission: ${permission}`);
  }
}
