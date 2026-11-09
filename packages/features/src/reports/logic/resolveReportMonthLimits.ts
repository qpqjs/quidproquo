import { REPORT_DEFAULT_MAX_CELLS_PER_BUCKET } from '../constants/reportDefaultMaxCellsPerBucket';
import { REPORT_DEFAULT_MAX_DIMENSION_NAMES } from '../constants/reportDefaultMaxDimensionNames';
import { REPORT_DEFAULT_MAX_MEASURE_NAMES } from '../constants/reportDefaultMaxMeasureNames';
import { ReportEventSettings } from '../models/ReportEventSettings';
import { ReportMonthLimits } from '../models/ReportMonthLimits';

/** The caps a batch of one event type is folded under: its settings, or the defaults where it names none. */
export const resolveReportMonthLimits = (settings?: ReportEventSettings): ReportMonthLimits => ({
  maxCellsPerBucket: settings?.maxCellsPerBucket ?? REPORT_DEFAULT_MAX_CELLS_PER_BUCKET,
  maxDimensionNames: settings?.maxDimensionNames ?? REPORT_DEFAULT_MAX_DIMENSION_NAMES,
  maxMeasureNames: settings?.maxMeasureNames ?? REPORT_DEFAULT_MAX_MEASURE_NAMES,
});
