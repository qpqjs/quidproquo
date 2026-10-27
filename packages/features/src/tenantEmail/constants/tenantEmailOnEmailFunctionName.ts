/** The inline function a tenanted receiver's app handler is registered as. */
export const tenantEmailOnEmailFunctionName = (receiverName: string): string => `qpq-tenant-email-on-email-${receiverName}`;
