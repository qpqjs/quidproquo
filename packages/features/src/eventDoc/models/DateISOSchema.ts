import { getValidQpqIsoDateTime, QpqIsoDateTime } from '@qpqjs/core';

import { z } from 'zod';

/** Zod validator for QpqIsoDateTime. */
export const DateISOSchema = z.custom<QpqIsoDateTime>(
  (val) => typeof val === 'string' && getValidQpqIsoDateTime(val) !== undefined,
  'Invalid DateISO',
);
