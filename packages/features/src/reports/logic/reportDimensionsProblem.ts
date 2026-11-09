import { Nullable } from '@qpqjs/core';

import { isReportRecord } from './isReportRecord';

/** Why a value is not a flat object of string, finite number or boolean values, or null when it is one. */
export const reportDimensionsProblem = (dimensions: unknown): Nullable<string> => {
  if (!isReportRecord(dimensions)) {
    return 'must be a flat object of dimension values';
  }

  const badKey = Object.keys(dimensions).find((key) => {
    const value = dimensions[key];

    return !(typeof value === 'string' || typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)));
  });

  return badKey === undefined ? null : `'${badKey}' must be a string, a finite number or a boolean`;
};
