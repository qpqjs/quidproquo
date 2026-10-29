import { APIGatewayEvent } from 'aws-lambda';

// The request's path inside this service: API Gateway routes to a service on a base path that
// includes the service name, so the leading `/<serviceName>` segment is stripped (the + 1 is its
// slash). Defaults to '/' when the event has no path.
export const getApiRecordPath = (apiGatewayEvent: APIGatewayEvent, serviceName: string): string =>
  (apiGatewayEvent.path || '/').substring(serviceName.length + 1);
