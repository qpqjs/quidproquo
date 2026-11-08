/**
 * The per-kind suffix each service lambda's name ends in, before the deployment decoration.
 * Deploy names the function with it, the dashboard and the runtime invoke derive it, so the
 * scheme lives in one place.
 */
export enum QpqLambdaKind {
  Route = 'route',
  ServiceFunction = 'sfunc',
  Queue = 'queue',
  Schedule = 'SE',
  Websocket = 'ws',
  Redirect = 'redirect',
}
