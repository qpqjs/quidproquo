import { askConfigGetGlobal, AskResponse } from 'quidproquo-core';
import { askServiceFunctionExecute } from 'quidproquo-webserver';

import { EVENT_DOC_STORE_NAME_GLOBAL } from '../../eventDoc';
import { SERVICE_REQUEST_DEFERRED, ServiceRequestDeferred } from '../../webSocketQueue/logic/service';
import { eventDocAiContinueFunctionName } from '../constants/eventDocAiContinueFunctionName';
import type { EventDocAiChatContinuePayload } from '../models';
import { askEventDocAiContextRead } from '../module';

// Fire-and-forget: the continuation runs on its own execution with this session,
// so it streams to the same connection and correlation and sends the final
// response itself. Returned as the handler result so no reply goes out here.
export function* askEventDocAiContinueHandoff(chatId: string, lengthResumes: number): AskResponse<ServiceRequestDeferred> {
  const { serviceName, docId } = yield* askEventDocAiContextRead();
  const storeName = yield* askConfigGetGlobal<string>(EVENT_DOC_STORE_NAME_GLOBAL);

  const payload: EventDocAiChatContinuePayload = { docId, chatId, lengthResumes };

  yield* askServiceFunctionExecute<void, EventDocAiChatContinuePayload>(serviceName, eventDocAiContinueFunctionName(storeName), payload, true);

  return SERVICE_REQUEST_DEFERRED;
}
