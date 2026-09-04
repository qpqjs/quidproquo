import { actionResult, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';
import { askOpenApiGetDocument, qpqWebServerUtils } from 'quidproquo-webserver';

const getProcessOpenApiGetDocument = (qpqConfig: QPQConfig): ProcessorFor<typeof askOpenApiGetDocument> => {
  return async ({ options }) => actionResult(qpqWebServerUtils.buildOpenApiDocument(qpqConfig, options));
};

export const getOpenApiGetDocumentActionProcessor = createActionProcessor(askOpenApiGetDocument, getProcessOpenApiGetDocument);
