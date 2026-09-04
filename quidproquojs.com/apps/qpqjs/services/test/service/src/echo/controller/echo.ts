import { AskResponse, HTTPEventResponse, qpqWebServerUtils } from 'quidproquo';
import { dynamicRoute } from 'quidproquo-features';

import {
  EchoRequestSchema,
  EchoResponse,
  EchoResponseSchema,
} from '@qpqjs/test-models';

// POST /echo/{pathValue}. Public. Exists to prove a value survives the trip
// through the url and the validated body: the response is both, unchanged.
export const echo = dynamicRoute(
  ['POST', '/echo/{pathValue}'],
  function* (event, params, { body }): AskResponse<HTTPEventResponse> {
    const response: EchoResponse = {
      pathValue: params.pathValue,
      bodyValue: body.bodyValue,
    };

    return qpqWebServerUtils.toJsonEventResponse(response);
  },
  {
    schema: {
      summary: 'Echo a path and body value',
      description: 'Returns the {pathValue} url segment and the bodyValue from the JSON body, untouched. Public, for trying the docs UI.',
      tags: ['echo'],
      body: EchoRequestSchema,
      response: EchoResponseSchema,
    },
  }
);
