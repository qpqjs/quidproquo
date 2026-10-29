import { AskResponse } from '@qpqjs/core';

import { askServiceRequest } from '../../webSocketQueue/actions';
import { askEventDocAiRead } from '../context';
import type { EventDocAiDocRef } from '../models';
import { buildEventDocAiMethodName } from './buildEventDocAiMethodName';

// The eventDocAi caller wrapper (mirrors mincept's createMinceptServiceRequester):
// reads the doc context provided around the chat UI and relays it over the wire
// as payload fields, routing (serviceName + type-scoped method) and the docId
// never appear in composites or request call sites. The backend wrapper
// (eventDocAiServiceRequest) strips the docId back off and re-provides it as
// context around the handler.
export function* askEventDocAiServiceRequest<TResult, TPayload = unknown>(method: string, payload: TPayload): AskResponse<TResult> {
  const { serviceName, type, docId } = yield* askEventDocAiRead();

  return yield* askServiceRequest<TResult, TPayload & EventDocAiDocRef>(serviceName, buildEventDocAiMethodName(type, method), {
    ...payload,
    docId,
  });
}
