import { actionResult, createActionProcessor, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { askMcpReadToolsets } from '../../actions/askMcpReadToolsets';
import { buildMcpToolsets } from '../../logic/buildMcpToolsets';

const getProcessReadToolsets = (qpqConfig: QPQConfig): ProcessorFor<typeof askMcpReadToolsets> => {
  const toolsets = buildMcpToolsets(qpqConfig);

  return async () => actionResult(toolsets);
};

/** Answers askMcpReadToolsets from the service's own config. Pure config reads, so one implementation serves every runtime. */
export const getMcpReadToolsets = createActionProcessor(askMcpReadToolsets, getProcessReadToolsets);
