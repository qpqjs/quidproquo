// The per-kind suffix each service lambda's name ends in, before the deployment decoration.
// Deploy names the function with it, the dashboard and the runtime invoke derive it, so the
// scheme lives in one place.
export enum QpqLambdaKind {
  Route = 'route',
  ServiceFunction = 'sfunc',
  Queue = 'queue',
  Schedule = 'SE',
  Websocket = 'ws',
  Redirect = 'redirect',
}

/** `<name>-<kind>`, the base a service lambda's deployed name is built from. */
export const getLambdaBaseName = (name: string, kind: QpqLambdaKind): string => `${name}-${kind}`;

/** The base name of the lambda that runs a service function. */
export const getServiceFunctionLambdaBaseName = (functionName: string): string => getLambdaBaseName(functionName, QpqLambdaKind.ServiceFunction);
