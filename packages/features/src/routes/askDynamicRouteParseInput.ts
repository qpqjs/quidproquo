import { AskResponse, askThrowError, ErrorTypeEnum } from '@qpqjs/core';
import { HTTPEvent, qpqWebServerUtils } from '@qpqjs/webserver';

import { askValidateSchemaOrThrowError } from '../validation/askValidateSchemaOrThrowError';
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

// Turn the raw event into the typed input a handler receives. Only the parts the
// route declared a schema for are touched; the rest come through as `undefined`.
export function* askDynamicRouteParseInput<TBody, TQuery>(
  event: HTTPEvent,
  schema?: DynamicRouteSchema<TBody, TQuery>,
): AskResponse<DynamicRouteInput<TBody, TQuery>> {
  const body = schema?.body ? yield* askValidateSchemaOrThrowError(schema.body, yield* askParseJsonBody(event), 'request body') : undefined;
  const query = schema?.query ? yield* askValidateSchemaOrThrowError(schema.query, event.query, 'query string') : undefined;

  return { body, query } as DynamicRouteInput<TBody, TQuery>;
}
