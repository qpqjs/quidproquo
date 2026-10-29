import { actionResult, askEventGetStorySessionBase, createActionProcessor, ProcessorFor, QPQConfig, storageScopeContext } from '@qpqjs/core';

import { InternalEventRecord } from './types';

const getProcessGetStorySession = (qpqConfig: QPQConfig): ProcessorFor<typeof askEventGetStorySessionBase> => {
  return async ({ qpqEventRecord: rawQpqEventRecord }) => {
    const qpqEventRecord = rawQpqEventRecord as InternalEventRecord;

    // A scoped object's handler runs under its scope, so the file and kvs
    // calls it makes stay in the same partition as the object that fired it.
    if (qpqEventRecord.scope !== undefined) {
      return actionResult({
        depth: 0,
        context: { [storageScopeContext.uniqueName]: qpqEventRecord.scope },
      });
    }

    return actionResult(undefined);
  };
};

export const getEventGetStorySessionActionProcessor = createActionProcessor(askEventGetStorySessionBase, getProcessGetStorySession);
