import { getUtcOffsetMinutes } from '@qpqjs/core';

import { REPORT_DEFAULT_FINANCIAL_YEAR_START_MONTH } from '../constants/reportDefaultFinancialYearStartMonth';
import { REPORT_DEFAULT_UTC_OFFSET } from '../constants/reportDefaultUtcOffset';
import { ReportsConfig } from '../models/ReportsConfig';
import { ReportsOptions } from '../types/ReportsOptions';
import { reportEventSettingsProblem } from './reportEventSettingsProblem';
import { reportViewProblem } from './reportViewProblem';

// Report names become resource names (stores, bus, global), so they stay to letters and digits.
const REPORT_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9]*$/;

/** A report's declaration with its defaults resolved. Pure: throws on the first problem it finds. */
export const resolveReportsConfig = (reportName: string, options: ReportsOptions): ReportsConfig => {
  const fail = (problem: string): never => {
    throw new Error(`defineReports('${reportName}'): ${problem}`);
  };

  if (!REPORT_NAME_PATTERN.test(reportName)) {
    fail('the report name must start with a letter and hold only letters and digits');
  }

  const utcOffset = options.utcOffset ?? REPORT_DEFAULT_UTC_OFFSET;

  if (getUtcOffsetMinutes(utcOffset) === null) {
    fail(`'${utcOffset}' is not a UTC offset; use ±HH:MM from -12:00 to +14:00 in quarter hours, such as +10:00 or +09:30`);
  }

  const financialYearStartMonth = options.financialYearStartMonth ?? REPORT_DEFAULT_FINANCIAL_YEAR_START_MONTH;

  if (!Number.isInteger(financialYearStartMonth) || financialYearStartMonth < 1 || financialYearStartMonth > 12) {
    fail('financialYearStartMonth must be a month number, 1 to 12');
  }

  const views = options.views ?? {};
  const events = options.events ?? {};

  Object.entries(views).forEach(([viewName, view]) => {
    const problem = reportViewProblem(view);

    if (problem) {
      fail(`view '${viewName}': ${problem}`);
    }
  });

  Object.entries(events).forEach(([eventType, settings]) => {
    const problem = reportEventSettingsProblem(settings);

    if (problem) {
      fail(`events.${eventType}: ${problem}`);
    }
  });

  return { utcOffset, financialYearStartMonth, scoped: options.scoped ?? false, views, events };
};
