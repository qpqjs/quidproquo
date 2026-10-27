import { QpqRuntimeType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { makeStoryResultBuilder } from '../../testing/genericTextExtractorTestHelpers';
import { serviceFunctionExeGenericTextExtractor } from './serviceFunctionExeGenericTextExtractor';

const buildStoryResult = makeStoryResultBuilder(QpqRuntimeType.SERVICE_FUNCTION_EXE);

describe('serviceFunctionExeGenericTextExtractor', () => {
  it('extracts the function name from the first input', () => {
    expect(serviceFunctionExeGenericTextExtractor(buildStoryResult({ input: [{ functionName: 'sendEmail' }] }))).toEqual(['sendEmail']);
  });

  it('falls back to an empty string when the function name is missing', () => {
    expect(serviceFunctionExeGenericTextExtractor(buildStoryResult({ input: [{}] }))).toEqual(['']);
  });

  it('returns a single empty string for a non-service-function runtime', () => {
    expect(serviceFunctionExeGenericTextExtractor(buildStoryResult({ runtimeType: QpqRuntimeType.API }))).toEqual(['']);
  });
});
