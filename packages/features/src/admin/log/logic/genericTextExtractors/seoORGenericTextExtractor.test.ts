import { actionResult, actionResultError, ErrorTypeEnum, QpqRuntimeType } from 'quidproquo-core';
import { SeoEvent } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { getRecordsHistory, makeStoryResultBuilder } from '../../testing/genericTextExtractorTestHelpers';
import { seoORGenericTextExtractor } from './seoORGenericTextExtractor';

const buildStoryResult = makeStoryResultBuilder(QpqRuntimeType.EVENT_SEO_OR);

const seoEvent = (path: string): SeoEvent => ({ path }) as SeoEvent;

describe('seoORGenericTextExtractor', () => {
  it('extracts the path of each seo event', () => {
    const result = seoORGenericTextExtractor(
      buildStoryResult({
        history: [getRecordsHistory(actionResult([seoEvent('/home'), seoEvent('/about')]))],
      }),
    );

    expect(result).toEqual(['/home', '/about']);
  });

  it('falls back to an empty string for an event without a path', () => {
    const result = seoORGenericTextExtractor(
      buildStoryResult({
        history: [getRecordsHistory(actionResult([{} as SeoEvent]))],
      }),
    );

    expect(result).toEqual(['']);
  });

  it('returns the error text when the get records action errored', () => {
    const result = seoORGenericTextExtractor(
      buildStoryResult({
        history: [getRecordsHistory(actionResultError(ErrorTypeEnum.GenericError, 'boom'))],
      }),
    );

    expect(result).toEqual(['boom']);
  });

  it('returns an empty array when there is no get records history', () => {
    expect(seoORGenericTextExtractor(buildStoryResult({ history: [] }))).toEqual([]);
  });

  it('returns a single empty string for a non-seo runtime', () => {
    expect(seoORGenericTextExtractor(buildStoryResult({ runtimeType: QpqRuntimeType.API }))).toEqual(['']);
  });
});
