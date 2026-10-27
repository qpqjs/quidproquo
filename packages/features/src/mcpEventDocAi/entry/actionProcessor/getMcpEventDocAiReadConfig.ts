import { actionResult, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { askMcpEventDocAiReadConfig } from '../../actions/askMcpEventDocAiReadConfig';
import { buildMcpEventDocAis } from '../../logic/buildMcpEventDocAis';

const getProcessReadConfig = (qpqConfig: QPQConfig): ProcessorFor<typeof askMcpEventDocAiReadConfig> => {
  const eventDocAis = buildMcpEventDocAis(qpqConfig);

  return async () => actionResult(eventDocAis);
};

/** Answers askMcpEventDocAiReadConfig from the service's own config. Pure config reads, so one implementation serves every runtime. */
export const getMcpEventDocAiReadConfig = createActionProcessor(askMcpEventDocAiReadConfig, getProcessReadConfig);
