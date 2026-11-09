import { Nullable } from '@qpqjs/core';

import { isReportRecord } from './isReportRecord';
import { reportUnknownKeyProblem } from './reportUnknownKeyProblem';

const isOptionalWholeAtLeastOne = (value: unknown): boolean =>
  value === undefined || (typeof value === 'number' && Number.isInteger(value) && value >= 1);

/** Why a value is not an event type's settings, or null when it is. */
export const reportEventSettingsProblem = (settings: unknown): Nullable<string> => {
  if (!isReportRecord(settings)) {
    return 'event settings must be an object';
  }

  const allowedDimensionsValid =
    settings.allowedDimensions === undefined ||
    (Array.isArray(settings.allowedDimensions) && settings.allowedDimensions.every((key) => typeof key === 'string' && key.length > 0));

  return (
    reportUnknownKeyProblem(settings, ['retentionMonths', 'maxCellsPerBucket', 'maxDimensionNames', 'maxMeasureNames', 'allowedDimensions']) ??
    (isOptionalWholeAtLeastOne(settings.retentionMonths) ? null : 'retentionMonths must be a whole number of at least 1') ??
    (isOptionalWholeAtLeastOne(settings.maxCellsPerBucket) ? null : 'maxCellsPerBucket must be a whole number of at least 1') ??
    (isOptionalWholeAtLeastOne(settings.maxDimensionNames) ? null : 'maxDimensionNames must be a whole number of at least 1') ??
    (isOptionalWholeAtLeastOne(settings.maxMeasureNames) ? null : 'maxMeasureNames must be a whole number of at least 1') ??
    (allowedDimensionsValid ? null : 'allowedDimensions must be a list of dimension names')
  );
};
