import { actionResult, actionResultError, askAiPromptStream, createActionProcessor, ErrorTypeEnum, ProcessorFor, QPQConfig } from 'quidproquo-core';

import { streamText } from 'ai';

import { randomGuid } from '../../../awsLambdaUtils';
import {
  buildAiPromptInput,
  buildAiStopConditions,
  createCachePrepareStep,
  createDriveFileResolver,
  logAiCacheUsage,
  mapAiStreamPart,
  prepareAiPromptCall,
  toAiStreamUsage,
  toBedrockReasoningOptions,
  toCacheableSystem,
  toErrorMessage,
} from './logic';
import { BedrockCacheSettings } from './types';

const getProcessAiPromptStream = (qpqConfig: QPQConfig): ProcessorFor<typeof askAiPromptStream> => {
  return async (payload, session, actionProcessorList, logger, updateSession, dynamicModuleLoader, streamRegistry) => {
    const prepared = prepareAiPromptCall(qpqConfig, payload, session, actionProcessorList, logger, dynamicModuleLoader, streamRegistry);
    if ('error' in prepared) {
      return actionResultError(prepared.error.type, prepared.error.message);
    }

    try {
      const input = await buildAiPromptInput(
        payload,
        createDriveFileResolver(qpqConfig, session, actionProcessorList, logger, dynamicModuleLoader, streamRegistry),
      );

      const cache: BedrockCacheSettings = { model: payload.model, cacheTtl: payload.cacheTtl };

      const providerOptions = toBedrockReasoningOptions(payload.model, payload.reasoning);

      const { stream, usage } = streamText({
        model: prepared.model,
        system: toCacheableSystem(payload.system, payload.caching, cache),
        ...input.promptOrMessages,
        tools: prepared.tools,
        providerOptions,
        stopWhen: buildAiStopConditions(payload),
        maxOutputTokens: payload.maxOutputTokens,
        prepareStep: payload.caching ? createCachePrepareStep({ ...cache, durableCount: input.durableCount }) : undefined,
        // streamText swallows errors by default to keep the server alive; surface them to
        // CloudWatch. The same error also reaches the consumer as an Error stream part.
        onError: ({ error }) => {
          console.error('AI prompt stream error:', error);
        },
      });

      const streamId = `ai-prompt-${Date.now()}-${randomGuid()}`;

      async function* aiStreamIterator(): AsyncIterableIterator<string> {
        for await (const part of stream) {
          yield JSON.stringify(mapAiStreamPart(part));
        }

        if (payload.caching) {
          try {
            logAiCacheUsage(toAiStreamUsage(await usage));
          } catch (error) {
            // usage rejects (AI_NoOutputGeneratedError) when the stream errored before
            // completing a step. The error part has already been streamed to the consumer;
            // throwing here would replace that real error with the unhelpful wrapper.
            console.warn('AI prompt cache usage unavailable:', toErrorMessage(error));
          }
        }
      }

      streamRegistry.register(streamId, aiStreamIterator());

      return actionResult({ id: streamId, encoding: 'json' as const });
    } catch (error) {
      if (error instanceof Error) {
        return actionResultError(ErrorTypeEnum.GenericError, error.message);
      }

      return actionResultError(ErrorTypeEnum.GenericError, 'An error occurred during AI prompt stream.');
    }
  };
};

export const getAiPromptStreamActionProcessor = createActionProcessor(askAiPromptStream, getProcessAiPromptStream);
