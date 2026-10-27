import { askCatch, askConfigGetGlobal, AskResponse } from 'quidproquo-core';
import { ExecuteServiceFunctionEvent } from 'quidproquo-webserver';

import { EVENT_DOC_TYPE_GLOBAL } from '../../../eventDoc';
import { askServiceRequestRespond, isServiceRequestDeferred } from '../../../webSocketQueue/logic/service';
import { EVENT_DOC_AI_SERVICE_NAME_GLOBAL } from '../../constants/eventDocAiGlobalNames';
import { askEventDocAiProcessContinue } from '../../logic/askEventDocAiProcessContinue';
import type { EventDocAiChatContinuePayload } from '../../models';
import { askEventDocAiContextProvide } from '../../module';

// The continuation entry, invoked async by a turn that ran out of runtime. It
// runs on the requesting session, so the doc context is rebuilt the same way
// eventDocAiServiceRequest builds it and the reply goes to the original
// websocket correlation. The docId is trusted: it came from that context.
export function* eventDocAiChatContinue(event: ExecuteServiceFunctionEvent<EventDocAiChatContinuePayload>): AskResponse<void> {
  const { docId, chatId, lengthResumes } = event.payload;

  const serviceName = yield* askConfigGetGlobal<string>(EVENT_DOC_AI_SERVICE_NAME_GLOBAL);
  const type = yield* askConfigGetGlobal<string>(EVENT_DOC_TYPE_GLOBAL);

  const result = yield* askCatch(
    askEventDocAiContextProvide({ serviceName, type, docId }, askEventDocAiProcessContinue(docId, chatId, lengthResumes)),
  );

  // Handed off again: the next execution answers.
  if (result.success && isServiceRequestDeferred(result.result)) {
    return;
  }

  yield* askServiceRequestRespond(result);
}
