import { HTTPNetworkResponse, NetworkRequestActionPayload } from 'quidproquo-core';

import { executeNetworkRequest } from './networkRequestUtils';

export const preformNetworkRequest = async <R>(payload: NetworkRequestActionPayload<any>): Promise<HTTPNetworkResponse<R>> => {
  try {
    return await executeNetworkRequest<R>(payload);
  } catch (err: any) {
    console.log(err);

    const errorResponse: HTTPNetworkResponse<R> = {
      headers: {},
      setCookies: [],
      status: 500,
      statusText: 'Internal Server Error',
      data: err.stack,
    };

    return errorResponse;
  }
};
