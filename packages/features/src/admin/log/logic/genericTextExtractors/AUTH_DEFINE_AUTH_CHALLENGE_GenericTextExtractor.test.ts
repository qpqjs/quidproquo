import { QpqRuntimeType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { makeStoryResultBuilder } from '../../testing/genericTextExtractorTestHelpers';
import { AUTH_DEFINE_AUTH_CHALLENGE_GenericTextExtractor } from './AUTH_DEFINE_AUTH_CHALLENGE_GenericTextExtractor';

const buildStoryResult = makeStoryResultBuilder(QpqRuntimeType.AUTH_DEFINE_AUTH_CHALLENGE);

describe('AUTH_DEFINE_AUTH_CHALLENGE_GenericTextExtractor', () => {
  it('extracts the trigger source from the first input', () => {
    expect(
      AUTH_DEFINE_AUTH_CHALLENGE_GenericTextExtractor(buildStoryResult({ input: [{ triggerSource: 'DefineAuthChallenge_Authentication' }] })),
    ).toEqual(['DefineAuthChallenge_Authentication']);
  });

  it('falls back to unknown when the trigger source is missing', () => {
    expect(AUTH_DEFINE_AUTH_CHALLENGE_GenericTextExtractor(buildStoryResult({ input: [{}] }))).toEqual(['unknown']);
  });

  it('returns a single empty string for a non-matching runtime', () => {
    expect(AUTH_DEFINE_AUTH_CHALLENGE_GenericTextExtractor(buildStoryResult({ runtimeType: QpqRuntimeType.API }))).toEqual(['']);
  });
});
