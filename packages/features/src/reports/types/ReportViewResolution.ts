import { ReportViewDefinition } from '../models/ReportViewDefinition';

/** A view name or ad hoc view resolved against a report, or the reason it cannot be read. */
export type ReportViewResolution = { view: ReportViewDefinition } | { problem: string };
