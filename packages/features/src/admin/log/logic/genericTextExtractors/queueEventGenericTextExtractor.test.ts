import { QpqRuntimeType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { makeStoryResultBuilder } from '../../testing/genericTextExtractorTestHelpers';
import { queueEventGenericTextExtractor } from './queueEventGenericTextExtractor';

const buildStoryResult = makeStoryResultBuilder(QpqRuntimeType.QUEUE_EVENT);

describe('queueEventGenericTextExtractor', () => {
  it('extracts the message type from the first input', () => {
    expect(queueEventGenericTextExtractor(buildStoryResult({ input: [{ type: 'orderPlaced' }] }))).toEqual(['orderPlaced']);
  });

  it('falls back to an empty string when the type is missing', () => {
    expect(queueEventGenericTextExtractor(buildStoryResult({ input: [{}] }))).toEqual(['']);
  });

  it('returns a single empty string for a non-queue runtime', () => {
    expect(queueEventGenericTextExtractor(buildStoryResult({ runtimeType: QpqRuntimeType.API }))).toEqual(['']);
  });
});
