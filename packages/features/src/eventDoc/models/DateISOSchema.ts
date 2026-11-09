import { isQpqIsoDateTime, QpqIsoDateTime } from '@qpqjs/core';

import { z } from 'zod';

/** Zod validator for QpqIsoDateTime. */
export const DateISOSchema = z.custom<QpqIsoDateTime>(isQpqIsoDateTime, 'Invalid DateISO');
