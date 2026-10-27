/** Why a browser-side request never produced an HTTP response. */
export enum NetworkRequestErrorCode {
  // The request exceeded the outgoing request timeout and was aborted.
  timeout = 'timeout',
  // The HTTP method is one executeNetworkRequest refuses to send.
  unsupportedMethod = 'unsupportedMethod',
  // fetch itself rejected: no connection, DNS failure, CORS block, or an unparseable body.
  network = 'network',
}

/**
 * Thrown by preformNetworkRequest when no HTTP response came back at all, so callers can
 * tell a client-side failure from a server status by code instead of by error text.
 */
export class NetworkRequestError extends Error {
  constructor(
    public readonly code: NetworkRequestErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'NetworkRequestError';
  }
}
