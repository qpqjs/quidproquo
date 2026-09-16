/**
 * Returned by a service-request handler instead of a response to skip the reply:
 * a later execution on the same connection and correlation will answer (for
 * example a turn handed to a continuation before the runtime deadline).
 */
export type ServiceRequestDeferred = { readonly serviceRequestDeferred: true };

export const SERVICE_REQUEST_DEFERRED: ServiceRequestDeferred = { serviceRequestDeferred: true };
