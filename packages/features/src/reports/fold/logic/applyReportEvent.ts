import { REPORT_OTHER_CELL_KEY } from '../../constants/reportOtherCellKey';
import { reportCellKey } from '../../logic/reportCellKey';
import { ReportMonthDocument } from '../../models/ReportMonthDocument';
import { ReportMonthLimits } from '../../models/ReportMonthLimits';
import { ReportStoredEvent } from '../../models/ReportStoredEvent';
import { addReportEventToCells } from './addReportEventToCells';
import { keepReportMeasures } from './keepReportMeasures';
import { mergeReportKeys } from './mergeReportKeys';

/**
 * The document with one event counted in its stamped hour and day. An event whose dimension names would take the
 * month past `maxDimensionNames` is counted in the `other` cell and adds no names; a measure name past
 * `maxMeasureNames` is not counted. Either sets `namesCapped`. The hourly trim is the batch's to run.
 */
export const applyReportEvent = (state: ReportMonthDocument, event: ReportStoredEvent, limits: ReportMonthLimits): ReportMonthDocument => {
  const { hour, day } = event.bucketKeys;
  const dimensionKeys = mergeReportKeys(state.dimensionKeys, Object.keys(event.dimensions));
  const dimensionsFit = dimensionKeys.length <= limits.maxDimensionNames;
  const cellKey = dimensionsFit ? reportCellKey(event.dimensions) : REPORT_OTHER_CELL_KEY;
  const kept = keepReportMeasures(event.measures, state.measureKeys, limits.maxMeasureNames);
  const measuresFit = Object.keys(kept.measures).length === Object.keys(event.measures).length;
  const isNewest = state.newestAt === null || Date.parse(event.at) > Date.parse(state.newestAt);

  return {
    ...state,
    newestAt: isNewest ? event.at : state.newestAt,
    newestDay: isNewest ? day : state.newestDay,
    hourly: { ...state.hourly, [hour]: addReportEventToCells(state.hourly[hour] ?? {}, cellKey, kept.measures, limits.maxCellsPerBucket) },
    daily: { ...state.daily, [day]: addReportEventToCells(state.daily[day] ?? {}, cellKey, kept.measures, limits.maxCellsPerBucket) },
    dimensionKeys: dimensionsFit ? dimensionKeys : state.dimensionKeys,
    measureKeys: kept.measureKeys,
    namesCapped: state.namesCapped || !dimensionsFit || !measuresFit,
  };
};
