import { AskResponse } from 'quidproquo-core';

import { askServiceRequest } from '../../../webSocketQueue/logic/service';
import type { EventDocAiDocRef } from '../../models';
import { askEventDocAiContextRead } from '../qpqContexts/eventDocAiContext';
import { buildEventDocAiMethodName } from './buildEventDocAiMethodName';

// The eventDocAi caller wrapper (mirrors mincept's createMinceptServiceRequester):
// reads the doc context provided around the chat UI and relays it over the wire
// as payload fields — routing (serviceName + type-scoped method) and the docId
// never appear in composites or request call sites. The backend wrapper
// (eventDocAiServiceRequest) strips the docId back off and re-provides it as
// context around the handler.
export function* askEventDocAiServiceRequest<TPayload, TResponse>(method: string, payload: TPayload): AskResponse<TResponse> {
  const { serviceName, type, docId } = yield* askEventDocAiContextRead();

  return yield* askServiceRequest<TPayload & EventDocAiDocRef, TResponse>(serviceName, buildEventDocAiMethodName(type, method), {
    ...payload,
    docId,
  });
}
