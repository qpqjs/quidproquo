import { ReportEventsMessage } from '../models/ReportEventsMessage';

/** A queue payload read as a report events message, or the reason it is not one. */
export type ReportEventsMessageRead = { message: ReportEventsMessage } | { problem: string };
