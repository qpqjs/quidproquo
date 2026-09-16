import type { ServiceRequestDeferred } from './ServiceRequestDeferred';

export const isServiceRequestDeferred = (value: unknown): value is ServiceRequestDeferred =>
  typeof value === 'object' && value !== null && (value as ServiceRequestDeferred).serviceRequestDeferred === true;
