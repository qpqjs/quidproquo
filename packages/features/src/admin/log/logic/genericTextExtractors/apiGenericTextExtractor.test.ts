import { actionResult, actionResultError, ErrorTypeEnum, QpqRuntimeType } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

import { describe, expect, it } from 'vitest';

import { getRecordsHistory, makeStoryResultBuilder } from '../../testing/genericTextExtractorTestHelpers';
import { apiGenericTextExtractor } from './apiGenericTextExtractor';

const buildStoryResult = makeStoryResultBuilder(QpqRuntimeType.API);

const httpEvent = (overrides: Partial<HTTPEvent>): HTTPEvent =>
  ({
    method: 'GET',
    path: '/users',
    sourceIp: '1.2.3.4',
    ...overrides,
  }) as HTTPEvent;

describe('apiGenericTextExtractor', () => {
  it('extracts method, path and source ip for each event', () => {
    const result = apiGenericTextExtractor(
      buildStoryResult({
        history: [
          getRecordsHistory(
            actionResult([
              httpEvent({ method: 'GET', path: '/users', sourceIp: '1.2.3.4' }),
              httpEvent({ method: 'POST', path: '/login', sourceIp: '5.6.7.8' }),
            ]),
          ),
        ],
      }),
    );

    expect(result).toEqual(['GET::/users - [1.2.3.4]', 'POST::/login - [5.6.7.8]']);
  });

  it('returns the error text when the get records action errored', () => {
    const result = apiGenericTextExtractor(
      buildStoryResult({
        history: [getRecordsHistory(actionResultError(ErrorTypeEnum.GenericError, 'boom'))],
      }),
    );

    expect(result).toEqual(['boom']);
  });

  it('returns an empty array when there is no get records history', () => {
    expect(apiGenericTextExtractor(buildStoryResult({ history: [] }))).toEqual([]);
  });

  it('returns an empty array for a non-api runtime', () => {
    expect(apiGenericTextExtractor(buildStoryResult({ runtimeType: QpqRuntimeType.QUEUE_EVENT }))).toEqual([]);
  });
});
