import { AskResponse, askThrowError, ErrorTypeEnum } from 'quidproquo-core';
import { HTTPEvent } from 'quidproquo-webserver';

/** Parse an HTTP request body as JSON, throwing BadRequest on malformed input. */
export function* askEventDocParseBody<T extends object>(event: HTTPEvent): AskResponse<T> {
  let parsed: unknown;

  try {
    const rawBody = event.isBase64Encoded && event.body ? Buffer.from(event.body, 'base64').toString('utf-8') : event.body;

    parsed = JSON.parse(rawBody ?? '{}');
  } catch {
    parsed = undefined;
  }

  if (!parsed || typeof parsed !== 'object') {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, 'Invalid JSON request body');
  }

  return parsed as T;
}
