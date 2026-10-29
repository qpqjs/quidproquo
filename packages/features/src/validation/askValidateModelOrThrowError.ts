import { AskResponse, askThrowError, ErrorTypeEnum } from '@qpqjs/core';

import { z } from 'zod';

/** Parses `model` against `schema`; a mismatch throws Invalid naming the path and expectation, never the submitted value. */
export function* askValidateModelOrThrowError<T extends z.ZodType>(model: z.infer<T>, schema: T): AskResponse<z.infer<T>> {
  const validation = schema.safeParse(model);

  if (!validation.success) {
    return yield* askThrowError(ErrorTypeEnum.Invalid, z.prettifyError(validation.error));
  }

  return model;
}
