import { getUtcOffsetMinutes, isQpqIsoDateTime, Nullable, UtcOffset } from '@qpqjs/core';

import { REPORT_EVENT_TYPE_PATTERN } from '../constants/reportEventTypePattern';
import { REPORT_MAX_DIMENSIONS_PER_EVENT } from '../constants/reportMaxDimensionsPerEvent';
import { REPORT_MAX_EVENT_BYTES } from '../constants/reportMaxEventBytes';
import { isReportRecord } from './isReportRecord';
import { reportDimensionsProblem } from './reportDimensionsProblem';
import { reportMeasuresProblem } from './reportMeasuresProblem';
import { reportNamesProblem } from './reportNamesProblem';
import { reportUnknownKeyProblem } from './reportUnknownKeyProblem';

const EVENT_KEYS = ['type', 'at', 'utcOffset', 'dimensions', 'measures'] as const;

const typeProblem = (type: unknown): Nullable<string> =>
  typeof type === 'string' && REPORT_EVENT_TYPE_PATTERN.test(type)
    ? null
    : "type must start with a letter and hold only letters, digits, '.', '_' or '-', at most 64 characters";

// Untrusted text: checking it is the point, so it is handed over as an offset to be checked.
const utcOffsetProblem = (utcOffset: unknown): Nullable<string> =>
  typeof utcOffset === 'string' && getUtcOffsetMinutes(utcOffset as UtcOffset) !== null ? null : 'utcOffset must be ±HH:MM from -12:00 to +14:00';

const dimensionsProblem = (dimensions: unknown): Nullable<string> => {
  const shapeProblem = reportDimensionsProblem(dimensions);

  if (shapeProblem !== null || !isReportRecord(dimensions)) {
    return `dimensions: ${shapeProblem ?? 'must be an object'}`;
  }

  return (
    reportNamesProblem(dimensions) ??
    (Object.keys(dimensions).length <= REPORT_MAX_DIMENSIONS_PER_EVENT
      ? null
      : `an event may carry at most ${REPORT_MAX_DIMENSIONS_PER_EVENT} dimensions`)
  );
};

const measuresProblem = (measures: unknown): Nullable<string> => {
  const shapeProblem = reportMeasuresProblem(measures);

  if (shapeProblem !== null || !isReportRecord(measures)) {
    return shapeProblem ?? 'measures must be an object';
  }

  return reportNamesProblem(measures);
};

/**
 * Why a value is not a report event ready for the bus, or null when it is one. Shape only: no event type is declared, so
 * any type, dimension or measure inside these bounds is accepted. The append and the consumer both run it.
 */
export const reportQueuedEventProblem = (event: unknown): Nullable<string> => {
  if (!isReportRecord(event)) {
    return 'an event must be an object';
  }

  return (
    reportUnknownKeyProblem(event, EVENT_KEYS) ??
    typeProblem(event.type) ??
    (isQpqIsoDateTime(event.at) ? null : 'at must be an ISO date-time such as 2026-11-09T05:12:40.118Z') ??
    utcOffsetProblem(event.utcOffset) ??
    dimensionsProblem(event.dimensions) ??
    measuresProblem(event.measures) ??
    (new TextEncoder().encode(JSON.stringify(event)).length <= REPORT_MAX_EVENT_BYTES
      ? null
      : `an event may be at most ${REPORT_MAX_EVENT_BYTES} bytes`)
  );
};
