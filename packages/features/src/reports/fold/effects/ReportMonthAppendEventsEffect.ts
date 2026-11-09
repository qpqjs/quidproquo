import { Effect } from '@qpqjs/core';

import { ReportMonthAppendEventsData } from '../../models/ReportMonthAppendEventsData';
import { ReportMonthEffect } from './ReportMonthEffect';

/** One queue batch of report events folded into the month's cells. Server only: the report consumer is its one author. */
export type ReportMonthAppendEventsEffect = Effect<ReportMonthEffect.AppendEvents, ReportMonthAppendEventsData>;
