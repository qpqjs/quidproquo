import { qpqConfigAwsUtils } from 'quidproquo-config-aws';
import { actionResult, actionResultError, actionResultErrorFromCaughtError, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';
import { askWebsocketSendMessageBase, WebsocketActionType } from 'quidproquo-webserver';

import { getCFExportNameWebsocketApiIdFromConfig } from '../../../awsNamingUtils';
import { sendMessageToWebSocketConnection } from '../../../logic/apiGateway/sendMessageToWebSocketConnection';
import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';

const getProcessSendMessage = (qpqConfig: QPQConfig): ProcessorFor<typeof askWebsocketSendMessageBase> => {
  return async ({ connectionId, payload, websocketApiName }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    const apiId = await getExportedValue(getCFExportNameWebsocketApiIdFromConfig(websocketApiName, qpqConfig), region);

    try {
      await sendMessageToWebSocketConnection(apiId, connectionId, region, payload);

      return actionResult(void 0);
    } catch (error) {
      return actionResultErrorFromCaughtError(error, {
        ThrottlingException: () => actionResultError(askWebsocketSendMessageBase.errorType.Throttled, 'Rate exceeded'),
        GoneException: () => actionResultError(askWebsocketSendMessageBase.errorType.Disconnected, 'Connection no longer exists'),
      });
    }
  };
};

export const getWebsocketSendMessageActionProcessor = createActionProcessor(askWebsocketSendMessageBase, getProcessSendMessage);
