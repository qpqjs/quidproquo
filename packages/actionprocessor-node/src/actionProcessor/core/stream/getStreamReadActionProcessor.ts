import { actionResult, actionResultError, askStreamReadBase, createActionProcessor, ProcessorFor, QPQConfig } from '@qpqjs/core';

const getProcessStreamRead = (qpqConfig: QPQConfig): ProcessorFor<typeof askStreamReadBase> => {
  return async ({ streamId, noWait }, session, actionProcessors, logger, updateSession, dynamicModuleLoader, streamRegistry) => {
    if (!streamRegistry.has(streamId)) {
      return actionResultError(askStreamReadBase.errorType.StreamNotFound, `Stream not found: ${streamId}`);
    }

    try {
      return actionResult(await streamRegistry.read(streamId, noWait));
    } catch (error) {
      // The registry drops a stream whose producer threw and rethrows that error on the read.
      const message = error instanceof Error ? error.message : String(error);
      return actionResultError(
        askStreamReadBase.errorType.StreamFailed,
        `Stream [${streamId}] failed: ${message}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  };
};

export const getStreamReadActionProcessor = createActionProcessor(askStreamReadBase, getProcessStreamRead);
