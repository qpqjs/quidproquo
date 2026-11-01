import { AskResponse } from '@qpqjs/core';

import { z } from 'zod';

import { askValidateSchemaOrThrowError } from './askValidateSchemaOrThrowError';

/** Parses `model` against `schema`; a mismatch throws Invalid naming the path and expectation, never the submitted value. */
export function* askValidateModelOrThrowError<T extends z.ZodType>(model: z.infer<T>, schema: T): AskResponse<z.infer<T>> {
  yield* askValidateSchemaOrThrowError(schema, model);

  return model;
}
