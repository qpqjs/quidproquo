import { actionResult, createActionProcessor, ProcessorFor, QPQConfig, qpqCoreUtils } from '@qpqjs/core';
import { askOpenApiGetDocument, qpqWebServerUtils } from '@qpqjs/webserver';

// The dev server serves every api on one origin, mounted at /<apiSubdomain>/<service>
// instead of on its own subdomain, so the document's servers must say so or the
// reference UI aims its requests at a host that does not exist locally. The root
// has already been rewritten to the dev origin (localhost:port) by getAllServiceConfigs.
const buildDevServers = (qpqConfig: QPQConfig): { url: string }[] => {
  const baseDomain = qpqWebServerUtils.getPrimaryRootDomain(qpqConfig);
  const serviceName = qpqCoreUtils.getApplicationModuleName(qpqConfig);

  return qpqWebServerUtils
    .getAllApiConfigs(qpqConfig)
    .filter((api) => !api.deprecated)
    .map((api) => ({ url: `http://${baseDomain}/${api.apiSubdomain}/${serviceName}` }));
};

const getProcessOpenApiGetDocument = (qpqConfig: QPQConfig): ProcessorFor<typeof askOpenApiGetDocument> => {
  return async ({ options }) =>
    actionResult({
      ...qpqWebServerUtils.buildOpenApiDocument(qpqConfig, options),
      servers: buildDevServers(qpqConfig),
    });
};

export const getOpenApiGetDocumentActionProcessor = createActionProcessor(askOpenApiGetDocument, getProcessOpenApiGetDocument);
