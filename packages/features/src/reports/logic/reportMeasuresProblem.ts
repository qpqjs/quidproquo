import { Nullable } from '@qpqjs/core';

import { isReportRecord } from './isReportRecord';

/** Why a value is not a flat object of finite numbers, or null when it is one. */
export const reportMeasuresProblem = (measures: unknown): Nullable<string> => {
  if (!isReportRecord(measures)) {
    return 'measures must be a flat object of numbers';
  }

  const badName = Object.keys(measures).find((name) => {
    const value = measures[name];

    return !(typeof value === 'number' && Number.isFinite(value));
  });

  return badName === undefined ? null : `measure '${badName}' must be a finite number`;
};
