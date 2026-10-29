import {
  askStateDispatchBase,
  generateUuid,
  getDateNow,
  getProcessCustomImplementation,
  ProcessorFor,
  QPQConfig,
  StateActionType,
} from '@qpqjs/core';

import { askWebSocketQueueStateDispatchToFrontend } from '../../logic/webSocket/askWebSocketQueueStateDispatchToFrontend';

export const getStateDispatch = (qpqConfig: QPQConfig) => ({
  [StateActionType.Dispatch]: getProcessCustomImplementation<ProcessorFor<typeof askStateDispatchBase>>(
    qpqConfig,
    askWebSocketQueueStateDispatchToFrontend,
    'Send state dispatch to UI',
    null,
    getDateNow,
    generateUuid,
  ),
});
