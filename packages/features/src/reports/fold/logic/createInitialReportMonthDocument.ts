import { createEventDocInitialDocumentState } from '../../../eventDoc/fold/createEventDocInitialDocumentState';
import { ReportMonthDocument } from '../../models/ReportMonthDocument';

/** The month document's version-1 initial state: nothing counted. */
export const createInitialReportMonthDocument = (): ReportMonthDocument => ({
  ...createEventDocInitialDocumentState(1),
  newestAt: null,
  newestDay: null,
  hourly: {},
  daily: {},
  dimensionKeys: [],
  measureKeys: [],
  namesCapped: false,
});
