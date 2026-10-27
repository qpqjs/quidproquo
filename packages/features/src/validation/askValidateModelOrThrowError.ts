import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';

import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

export function* askValidateModelOrThrowError<T extends z.ZodTypeAny>(model: z.infer<T>, schema: T): AskResponse<z.infer<T>> {
  // validate model
  const validation = schema.safeParse(model);

  // Throw error on invalid payload
  if (!validation.success) {
    const error = fromZodError(validation.error);
    yield* askThrowError(ErrorTypeEnum.Invalid, error.message, error.stack);
  }

  return model;
}
