import { ReportQueuedEvent } from '../models/ReportQueuedEvent';

/** The event with only the dimensions its type allows, when the type has a closed set; otherwise the event as it is. */
export const keepReportAllowedDimensions = (event: ReportQueuedEvent, allowedDimensions?: string[]): ReportQueuedEvent =>
  allowedDimensions
    ? { ...event, dimensions: Object.fromEntries(Object.entries(event.dimensions).filter(([name]) => allowedDimensions.includes(name))) }
    : event;
