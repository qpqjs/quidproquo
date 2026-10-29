import {
  actionResult,
  actionResultError,
  actionResultErrorFromCaughtError,
  createActionProcessor,
  ProcessorFor,
  QPQConfig,
  qpqCoreUtils,
} from '@qpqjs/core';
import { askWebsocketSendMessageBase, qpqWebServerUtils } from '@qpqjs/webserver';

// The connection REGISTRY, not the implementation: webSocketImplementation imports
// the event-processing pipeline (which includes these processors), so importing it
// here would close an import cycle. The registry is a leaf holding the live
// connections both sides share.
import { sendMessageToWebSocketConnection } from '../../../implementations/webSocket/webSocketConnectionRegistry';

const getProcessSendMessage = (qpqConfig: QPQConfig): ProcessorFor<typeof askWebsocketSendMessageBase> => {
  return async ({ connectionId, payload, websocketApiName }) => {
    const websocketConfig = qpqWebServerUtils.getWebsocketEntryByApiName(websocketApiName, qpqConfig);
    const service = qpqCoreUtils.resolveOwnerModuleName(websocketConfig.owner, qpqConfig);

    try {
      // A connection that is no longer registered answers Disconnected, as AWS does with GoneException.
      const sent = await sendMessageToWebSocketConnection(service, websocketApiName, connectionId, payload);
      if (!sent) {
        return actionResultError(askWebsocketSendMessageBase.errorType.Disconnected, 'Connection no longer exists');
      }

      return actionResult(undefined);
    } catch (error) {
      // A send that throws (socket closing) has no catalogued local failure; it becomes GenericError.
      return actionResultErrorFromCaughtError(error);
    }
  };
};

export const getWebsocketSendMessageActionProcessor = createActionProcessor(askWebsocketSendMessageBase, getProcessSendMessage);
