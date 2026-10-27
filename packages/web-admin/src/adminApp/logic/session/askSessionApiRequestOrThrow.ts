import { AskResponse, askThrowError, ErrorTypeEnum, HTTPMethod } from 'quidproquo-core';

import { askSessionApiRequest } from './askSessionApiRequest';

export function* askSessionApiRequestOrThrow<TBody, TResponse>(method: HTTPMethod, url: string, body?: TBody): AskResponse<TResponse> {
  const response = yield* askSessionApiRequest<TBody, TResponse>(method, url, body);

  if (response.status < 200 || response.status >= 300) {
    return yield* askThrowError(ErrorTypeEnum.GenericError, `Session request failed (${response.status}): ${method}::${url}`);
  }

  return response.data;
}
