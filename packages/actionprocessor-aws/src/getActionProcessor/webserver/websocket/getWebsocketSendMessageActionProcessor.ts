import { awsNamingUtils, qpqConfigAwsUtils } from '@qpqjs/config-aws';
import { actionResult, actionResultError, actionResultErrorFromCaughtError, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';
import { askWebsocketSendMessageBase } from '@qpqjs/webserver';

import { sendMessageToWebSocketConnection } from '../../../logic/apiGateway/sendMessageToWebSocketConnection';
import { getExportedValue } from '../../../logic/cloudformation/getExportedValue';

const getProcessSendMessage = (qpqConfig: QPQConfig): ProcessorFor<typeof askWebsocketSendMessageBase> => {
  return async ({ connectionId, payload, websocketApiName }) => {
    const region = qpqConfigAwsUtils.getApplicationModuleDeployRegion(qpqConfig);

    try {
      const apiId = await getExportedValue(awsNamingUtils.getCFExportNameWebsocketApiIdFromConfig(websocketApiName, qpqConfig), region);

      await sendMessageToWebSocketConnection(apiId, connectionId, region, payload);

      return actionResult(undefined);
    } catch (error: unknown) {
      return actionResultErrorFromCaughtError(error, {
        ThrottlingException: () => actionResultError(askWebsocketSendMessageBase.errorType.Throttled, 'Rate exceeded'),
        GoneException: () => actionResultError(askWebsocketSendMessageBase.errorType.Disconnected, 'Connection no longer exists'),
      });
    }
  };
};

export const getWebsocketSendMessageActionProcessor = createActionProcessor(askWebsocketSendMessageBase, getProcessSendMessage);
