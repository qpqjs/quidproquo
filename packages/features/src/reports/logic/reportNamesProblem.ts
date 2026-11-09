import { Nullable } from '@qpqjs/core';

import { REPORT_RESERVED_KEYS } from '../constants/reportReservedKeys';

/** Why a record's keys cannot be dimension or measure names (empty, or an Object.prototype member), or null when they can. */
export const reportNamesProblem = (record: Record<string, unknown>): Nullable<string> => {
  const badName = Object.keys(record).find((name) => name === '' || REPORT_RESERVED_KEYS.includes(name));

  return badName === undefined ? null : `'${badName}' cannot be a dimension or measure name`;
};
