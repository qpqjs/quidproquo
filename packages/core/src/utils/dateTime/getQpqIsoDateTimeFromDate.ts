import { QpqIsoDateTime } from '../../types/QpqIsoDateTime';

export const getQpqIsoDateTimeFromDate = (date: Date): QpqIsoDateTime => date.toISOString() as QpqIsoDateTime;
