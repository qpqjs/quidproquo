import { dynamicRoute } from '@qpqjs/features';
import { askDateNow, AskResponse, HTTPEvent, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo';

export const health = dynamicRoute(['GET', '/health'], function* healthCheck(event: HTTPEvent): AskResponse<HTTPEventResponse> {
  const checkedAt = yield* askDateNow();

  return qpqWebServerUtils.toJsonEventResponse({
    status: 'healthy',
    service: 'shell',
    checkedAt,
  });
});
