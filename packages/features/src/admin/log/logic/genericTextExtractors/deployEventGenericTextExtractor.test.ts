import { actionResult, actionResultError, DeployEventStatusType, DeployEventType, ErrorTypeEnum, QpqRuntimeType } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { getRecordsHistory, makeStoryResultBuilder } from '../../testing/genericTextExtractorTestHelpers';
import { deployEventGenericTextExtractor } from './deployEventGenericTextExtractor';

const buildStoryResult = makeStoryResultBuilder(QpqRuntimeType.DEPLOY_EVENT);

describe('deployEventGenericTextExtractor', () => {
  it('extracts the type and status for each deploy event', () => {
    const result = deployEventGenericTextExtractor(
      buildStoryResult({
        history: [
          getRecordsHistory(
            actionResult([
              { deployEventType: DeployEventType.Api, deployEventStatusType: DeployEventStatusType.Update },
              { deployEventType: DeployEventType.Web, deployEventStatusType: DeployEventStatusType.Create },
            ]),
          ),
        ],
      }),
    );

    expect(result).toEqual(['Api::Update', 'Web::Create']);
  });

  it('returns the error text when the get records action errored', () => {
    const result = deployEventGenericTextExtractor(
      buildStoryResult({
        history: [getRecordsHistory(actionResultError(ErrorTypeEnum.GenericError, 'boom'))],
      }),
    );

    expect(result).toEqual(['boom']);
  });

  it('returns an empty array when there is no get records history', () => {
    expect(deployEventGenericTextExtractor(buildStoryResult({ history: [] }))).toEqual([]);
  });

  it('returns a single empty string for a non-deploy runtime', () => {
    expect(deployEventGenericTextExtractor(buildStoryResult({ runtimeType: QpqRuntimeType.API }))).toEqual(['']);
  });
});
