// The MF container name for a service. Sanitized to a valid JS identifier because it
// becomes a global variable name at runtime (qpq_my_service).
export const getFederatedContainerName = (serviceName: string): string => {
  return `qpq_${serviceName.replace(/[^a-zA-Z0-9_]/g, '_')}`;
};
