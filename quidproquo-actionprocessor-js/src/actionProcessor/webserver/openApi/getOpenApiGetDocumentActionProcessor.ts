import { actionResult, createActionProcessor, DynamicModuleLoader, ProcessorFor, QPQConfig } from 'quidproquo-core';
import { askOpenApiGetDocument, qpqWebServerUtils } from 'quidproquo-webserver';

const getProcessOpenApiGetDocument = async (
  qpqConfig: QPQConfig,
  loader: DynamicModuleLoader,
): Promise<ProcessorFor<typeof askOpenApiGetDocument>> => {
  const domainResolver = await qpqWebServerUtils.loadDomainResolver(qpqConfig, loader);

  return async ({ options }) => actionResult(qpqWebServerUtils.buildOpenApiDocument(qpqConfig, options, domainResolver));
};

export const getOpenApiGetDocumentActionProcessor = createActionProcessor(askOpenApiGetDocument, getProcessOpenApiGetDocument);
