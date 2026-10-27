import { askCatch, AskResponse, askThrowError, ErrorTypeEnum, HTTPMethod } from 'quidproquo-core';
import { HTTPEvent, HTTPEventResponse, qpqWebServerUtils, RouteOptions } from 'quidproquo-webserver';

import { askDynamicRouteParseInput } from './askDynamicRouteParseInput';
import { DynamicRouteConfig } from './DynamicRouteConfig';
import { DynamicRouteInput } from './DynamicRouteInput';
import { DynamicRouteKnownErrors, isDynamicRouteErrorCode } from './DynamicRouteKnownErrors';
import { toRouteSchema } from './toRouteSchema';

export type ExtractRouteParams<S extends string> = string extends S
  ? Record<string, string>
  : S extends `${infer _Start}{${infer Param}}${infer Rest}`
    ? { [K in Param | keyof ExtractRouteParams<Rest>]: string }
    : Record<never, never>;

export type DynamicRouteSettings<S extends string> = [HTTPMethod, S] | [HTTPMethod, S, number] | [HTTPMethod, S, number, RouteOptions];

// The story behind a route. `input` carries the body and query already parsed
// against the route's schema, so handlers never touch `event.body` themselves.
export type DynamicRouteRuntime<S extends string, TBody = undefined, TQuery = undefined> = (
  event: HTTPEvent,
  params: ExtractRouteParams<S>,
  input: DynamicRouteInput<TBody, TQuery>,
) => AskResponse<HTTPEventResponse>;

// The route config carried alongside the handler, harvested by defineDynamicRoutes
export interface DynamicRouteMeta {
  method: HTTPMethod;
  path: string;
  options?: RouteOptions;
  version: number;
}

// A story handler branded with its own route config. The `S` param keeps the
// path-param typing available to anyone calling the handler directly; the brand
// lets defineDynamicRoutes accept a controller module without falling back to `any`.
export type DynamicRouteHandler<S extends string = string> = ((event: HTTPEvent, params: ExtractRouteParams<S>) => AskResponse<HTTPEventResponse>) & {
  dynamicRoute: DynamicRouteMeta;
};

// A zod schema on the config wins over any plain RouteSchema in the settings tuple,
// field by field, because it is the one the handler is actually validated against.
const withSchema = (options: RouteOptions | undefined, config: DynamicRouteConfig<unknown, unknown>): RouteOptions | undefined => {
  if (!config.schema) {
    return options;
  }

  return { ...options, schema: { ...options?.schema, ...toRouteSchema(config.schema) } };
};

export const dynamicRoute = <S extends string, TBody = undefined, TQuery = undefined>(
  settings: DynamicRouteSettings<S>,
  runtime: DynamicRouteRuntime<S, TBody, TQuery>,
  config: DynamicRouteConfig<TBody, TQuery> = {},
): DynamicRouteHandler<S> => {
  const [method, path, version, options] = settings;
  const { knownErrors, schema } = config;

  // Parsing lives inside the same askCatch as the handler so a schema failure
  // takes the Invalid -> 422 path like any other validation error.
  function* askRunWithInput(event: HTTPEvent, params: ExtractRouteParams<S>): AskResponse<HTTPEventResponse> {
    const input = yield* askDynamicRouteParseInput(event, schema);

    return yield* runtime(event, params, input);
  }

  const wrapper = function* wrapper(event: HTTPEvent, params: ExtractRouteParams<S>): AskResponse<HTTPEventResponse> {
    const res = yield* askCatch(askRunWithInput(event, params));

    if (!res.success) {
      const allKnownErrors: DynamicRouteKnownErrors = {
        ...(knownErrors || {}),

        // Every endpoint maps validation failures to a 422 response
        [ErrorTypeEnum.Invalid]: 422,
      };

      if (allKnownErrors[res.error.errorType]) {
        const errorInfo = allKnownErrors[res.error.errorType];
        if (isDynamicRouteErrorCode(errorInfo)) {
          return qpqWebServerUtils.toJsonEventResponse(
            {
              error: ErrorTypeEnum.GenericError,
              errorText: res.error.errorText,
            },
            errorInfo,
          );
        }

        return qpqWebServerUtils.toJsonEventResponse(
          {
            error: ErrorTypeEnum.GenericError,
            errorText: errorInfo.message,
          },
          errorInfo.code,
        );
      }

      // askThrowError yields a ThrowError action that terminates the handler at
      // runtime; the `return` just tells the type system this branch never falls
      // through, so `res` narrows to the success case below.
      return yield* askThrowError<HTTPEventResponse>(res.error.errorType, res.error.errorText);
    }

    return res.result;
  };

  return Object.assign(wrapper, {
    dynamicRoute: { method, path, options: withSchema(options, config), version: version || 1 },
  });
};
