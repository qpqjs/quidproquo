import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { HTTPEvent, qpqWebServerUtils } from 'quidproquo-webserver';

import { z } from 'zod/v4';

import { DynamicRouteInput } from './DynamicRouteInput';
import { DynamicRouteSchema } from './DynamicRouteSchema';

// Unreadable JSON is the caller's mistake in a different way to a shape mismatch:
// it gets a 400 rather than the 422 a validation failure maps to.
function* askParseJsonBody(event: HTTPEvent): AskResponse<unknown> {
  const raw = qpqWebServerUtils.rawFromJsonEventRequest(event);

  if (!raw) {
    return undefined;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, 'Invalid JSON request body');
  }
}

function* askValidate<T>(label: string, schema: z.ZodType<T>, value: unknown): AskResponse<T> {
  const result = schema.safeParse(value);

  if (!result.success) {
    return yield* askThrowError(ErrorTypeEnum.Invalid, `Invalid ${label}: ${z.prettifyError(result.error)}`);
  }

  return result.data;
}

// Turn the raw event into the typed input a handler receives. Only the parts the
// route declared a schema for are touched; the rest come through as `undefined`.
export function* askDynamicRouteParseInput<TBody, TQuery>(
  event: HTTPEvent,
  schema?: DynamicRouteSchema<TBody, TQuery>,
): AskResponse<DynamicRouteInput<TBody, TQuery>> {
  const body = schema?.body ? yield* askValidate('request body', schema.body, yield* askParseJsonBody(event)) : undefined;
  const query = schema?.query ? yield* askValidate('query string', schema.query, event.query) : undefined;

  return { body, query } as DynamicRouteInput<TBody, TQuery>;
}
