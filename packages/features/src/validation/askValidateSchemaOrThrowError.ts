import { AskResponse, askThrowError, ErrorTypeEnum } from '@qpqjs/core';

import { z } from 'zod';

/**
 * Parses `value` against `schema` and returns the parsed data; a mismatch throws Invalid naming the path and
 * expectation (prefixed `Invalid <label>: ` when a label is given), never the submitted value.
 */
export function* askValidateSchemaOrThrowError<T>(schema: z.ZodType<T>, value: unknown, label?: string): AskResponse<T> {
  const result = schema.safeParse(value);

  if (!result.success) {
    const detail = z.prettifyError(result.error);
    return yield* askThrowError(ErrorTypeEnum.Invalid, label ? `Invalid ${label}: ${detail}` : detail);
  }

  return result.data;
}
