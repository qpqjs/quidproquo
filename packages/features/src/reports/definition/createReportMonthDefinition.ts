import { createEventDocDefinition } from '../../eventDoc/definition/createEventDocDefinition';
import { REPORT_MONTH_SCHEMA_VERSION } from '../constants/reportMonthSchemaVersion';
import { ReportMonthEffect } from '../fold/effects/ReportMonthEffect';
import { createInitialReportMonthDocument } from '../fold/logic/createInitialReportMonthDocument';
import { reportMonthFoldReducer } from '../fold/reportMonthFoldReducer';

/**
 * The month document's definition. It has no identity on purpose: one module serves every report's collection, each
 * registering it under its own functions name. APPEND_EVENTS is server only; nothing but the report consumer writes.
 */
export const createReportMonthDefinition = () =>
  createEventDocDefinition({
    schemaVersion: REPORT_MONTH_SCHEMA_VERSION,
    versions: [
      {
        version: 1,
        views: {
          document: {
            foldReducer: reportMonthFoldReducer,
            createInitialViewState: createInitialReportMonthDocument,
          },
        },
      },
    ],
    serverEventTypes: [ReportMonthEffect.AppendEvents],
    api: {},
  });
