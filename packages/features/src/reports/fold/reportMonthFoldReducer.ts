import { QpqReducer } from '@qpqjs/core';

import { buildEventDocFoldReducer } from '../../eventDoc/fold/buildEventDocFoldReducer';
import { EventDocFoldEffects } from '../../eventDoc/fold/EventDocFoldEffects';
import { EventDocEvent } from '../../eventDoc/models';
import { ReportMonthDocument } from '../models/ReportMonthDocument';
import { ReportMonthEffect } from './effects/ReportMonthEffect';
import { ReportMonthEffects } from './effects/ReportMonthEffects';
import { createInitialReportMonthDocument } from './logic/createInitialReportMonthDocument';
import { appendReportMonthEvents } from './stateUpdaters/appendReportMonthEvents';

/** The month document's fold reducer: identity and lifecycle from the reserved effects, counting from APPEND_EVENTS. */
export const reportMonthFoldReducer = buildEventDocFoldReducer<ReportMonthDocument, EventDocFoldEffects<ReportMonthEffects>>(
  createInitialReportMonthDocument,
  {
    [ReportMonthEffect.AppendEvents]: appendReportMonthEvents,
  },
) as QpqReducer<ReportMonthDocument, EventDocEvent>;
