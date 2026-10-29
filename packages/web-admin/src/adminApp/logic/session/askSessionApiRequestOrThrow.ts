import { AskResponse, askThrowError, ErrorTypeEnum, HTTPMethod } from '@qpqjs/core';

import { askSessionApiRequest } from './askSessionApiRequest';

export function* askSessionApiRequestOrThrow<TResult, TPayload = unknown>(method: HTTPMethod, url: string, body?: TPayload): AskResponse<TResult> {
  const response = yield* askSessionApiRequest<TResult, TPayload>(method, url, body);

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Session request failed (${response.status}): ${method}::${url}`);
  }

  return response.data;
}
