import { QpqFunctionRuntime, QpqRuntimeType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { makeStoryResultBuilder } from '../../testing/genericTextExtractorTestHelpers';
import { unknownGenericTextExtractor } from './unknownGenericTextExtractor';

const buildStoryResult = makeStoryResultBuilder(QpqRuntimeType.EXECUTE_STORY);

describe('unknownGenericTextExtractor', () => {
  it('returns a simple string runtime info as-is', () => {
    expect(unknownGenericTextExtractor(buildStoryResult({ qpqFunctionRuntimeInfo: 'myFunction' as QpqFunctionRuntime }))).toEqual(['myFunction']);
  });

  it('builds a relative key without the base path for an advanced runtime info', () => {
    const qpqFunctionRuntimeInfo = { basePath: 'src', relativePath: 'handlers', functionName: 'doThing' } as unknown as QpqFunctionRuntime;

    expect(unknownGenericTextExtractor(buildStoryResult({ qpqFunctionRuntimeInfo }))).toEqual(['handlers::doThing']);
  });

  it('returns a single empty string when there is no runtime info', () => {
    expect(unknownGenericTextExtractor(buildStoryResult({ qpqFunctionRuntimeInfo: undefined }))).toEqual(['']);
  });
});
