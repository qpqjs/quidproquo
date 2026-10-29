import { AskResponse, askThrowError, ErrorTypeEnum } from '@qpqjs/core';

import { SeoEventResponse } from '../types';
import { HTTPEvent, HTTPEventResponse } from '../types/HTTPEvent';

export const rawFromJsonEventRequest = (httpJsonEvent: HTTPEvent): string | undefined => {
  const json = httpJsonEvent.isBase64Encoded && httpJsonEvent.body ? Buffer.from(httpJsonEvent.body, 'base64').toString() : httpJsonEvent.body;

  return json;
};

// TODO: Make a generator version of this
//       so we can throw errors with generators
export const fromJsonEventRequest = <T>(httpJsonEvent: HTTPEvent): T => {
  const json = rawFromJsonEventRequest(httpJsonEvent);

  if (!json) {
    throw new Error('Unable to parse undefined json body from event.');
  }

  try {
    const item: T = JSON.parse(json);
    return item;
  } catch {
    throw new Error('Unable to parse incoming json body from event.');
  }
};

export function* askFromJsonEventRequest<T>(httpJsonEvent: HTTPEvent): AskResponse<T> {
  const json = rawFromJsonEventRequest(httpJsonEvent);

  if (!json) {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, 'Unable to parse undefined json from HTTPEvent.');
  }

  try {
    const item: T = JSON.parse(json);
    return item;
  } catch {
    return yield* askThrowError(ErrorTypeEnum.BadRequest, 'Unable to parse incoming json from HTTPEvent.');
  }
}

/**
 * Validator for askFromValidJsonEventRequest: every named field must be a non-empty
 * string, otherwise it throws and the request is rejected as Invalid (422).
 */
export const requireStringFields =
  <T>(...fields: string[]) =>
  (data: unknown): T => {
    const record = (data ?? {}) as Record<string, unknown>;
    const missing = fields.filter((field) => typeof record[field] !== 'string' || record[field] === '');

    if (missing.length > 0) {
      throw new Error(`Missing or invalid fields: ${missing.join(', ')}`);
    }

    return data as T;
  };

/**
 * Like `askFromJsonEventRequest`, but the parsed body is run through an app-supplied
 * validator before it is returned - so the `T` is actually checked, not just cast.
 * The validator throws (or returns the typed value); a validation throw becomes an
 * `Invalid` (422) response. Any schema library fits, e.g. zod: `(data) => schema.parse(data)`.
 */
export function* askFromValidJsonEventRequest<T>(httpJsonEvent: HTTPEvent, validate: (data: unknown) => T): AskResponse<T> {
  const parsedBody = yield* askFromJsonEventRequest<unknown>(httpJsonEvent);

  try {
    return validate(parsedBody);
  } catch (error) {
    return yield* askThrowError(ErrorTypeEnum.Invalid, error instanceof Error ? error.message : 'Invalid request body.');
  }
}

export const readUriQueryParamFromEvent = (event: HTTPEvent, paramName: string): string | undefined => {
  const rawValue = event.query[paramName];

  if (!rawValue) {
    return undefined;
  }

  return Array.isArray(rawValue) ? rawValue[0] : rawValue;
};

export const toJsonEventResponse = (item: any, status: number = 200): HTTPEventResponse => {
  return {
    status,
    body: JSON.stringify(item),
    isBase64Encoded: false,
    headers: {
      'content-type': 'application/json',
    },
  };
};

export const toHtmlResponse = (html: string, status: number = 200): HTTPEventResponse => {
  return {
    status,
    body: html,
    isBase64Encoded: false,
    headers: {
      'content-type': 'text/html',
    },
  };
};

export const toTextResponse = (text: string, status: number = 200): HTTPEventResponse => {
  return {
    status,
    body: text,
    isBase64Encoded: false,
    headers: {
      'content-type': 'text/plain',
    },
  };
};

export const toMovedPermanentlyRedirectResponse = (location: string): HTTPEventResponse => {
  return {
    status: 301,
    isBase64Encoded: false,
    headers: {
      Location: location,
    },
  };
};

export const toMovedTemporarilyRedirectResponse = (location: string): HTTPEventResponse => {
  return {
    status: 302,
    isBase64Encoded: false,
    headers: {
      Location: location,
    },
  };
};

export const toCdnResponse = (status: number = 200): SeoEventResponse => {
  return {
    status,
    fallbackToCDN: true,
  };
};
