import { Nullable } from '@qpqjs/core';

import { REPORT_UNSCOPED_GROUP_KEY } from '../constants/reportUnscopedGroupKey';

/** The FIFO group a report message travels in: one ordered lane, so one writer, per scope and event type. */
export const reportGroupId = (scope: Nullable<string>, type: string): string => `${scope ?? REPORT_UNSCOPED_GROUP_KEY}/${type}`;
