import { QpqIsoDateTime } from '../../types/QpqIsoDateTime';

const qpqIsoDateTimeRegex = /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d{3}Z$/;

export const getValidQpqIsoDateTime = (value: string | undefined): QpqIsoDateTime | undefined => {
  if (!value || !qpqIsoDateTimeRegex.test(value)) {
    return undefined;
  }

  // The regex only checks the shape. Reject values that look right but aren't
  // real instants (month 00/13+, day 00/32+, hour 24+, or calendar overflows
  // like 2024-02-30) by requiring the value to round-trip through Date.
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) {
    return undefined;
  }

  return value as QpqIsoDateTime;
};
