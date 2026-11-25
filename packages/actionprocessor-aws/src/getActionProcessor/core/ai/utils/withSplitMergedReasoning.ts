import type { LanguageModel, LanguageModelMiddleware } from 'ai';
import { wrapLanguageModel } from 'ai';

import { createSplitMergedReasoningTransform } from './createSplitMergedReasoningTransform';

type WrappableModel = Parameters<typeof wrapLanguageModel>[0]['model'];

/** The middleware that runs a model's stream through createSplitMergedReasoningTransform. */
const splitMergedReasoningMiddleware: LanguageModelMiddleware = {
  wrapStream: async ({ doStream }) => {
    const { stream, ...rest } = await doStream();

    return { ...rest, stream: stream.pipeThrough(createSplitMergedReasoningTransform()) };
  },
};

/**
 * The model with its streamed reasoning kept one block per part (see
 * createSplitMergedReasoningTransform), so a tool loop sends each block back as the model wrote it.
 */
export const withSplitMergedReasoning = (model: WrappableModel): LanguageModel =>
  wrapLanguageModel({ model, middleware: splitMergedReasoningMiddleware });
