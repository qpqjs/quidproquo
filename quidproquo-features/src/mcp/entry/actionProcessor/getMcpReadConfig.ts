import { actionResult, actionResultError, createActionProcessor, ErrorTypeEnum, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { askMcpReadConfig } from '../../actions/askMcpReadConfig';
import { buildMcpConfig } from '../../logic/buildMcpConfig';

const getProcessReadConfig = (qpqConfig: QPQConfig): ProcessorFor<typeof askMcpReadConfig> => {
  const config = buildMcpConfig(qpqConfig);

  return async () => (config ? actionResult(config) : actionResultError(ErrorTypeEnum.NotFound, 'No defineMcpServer in this service.'));
};

/** Answers askMcpReadConfig from the service's own config. Pure config reads, so one implementation serves every runtime. */
export const getMcpReadConfig = createActionProcessor(askMcpReadConfig, getProcessReadConfig);
