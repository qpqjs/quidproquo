import { createEmptyReportCell } from '../fold/logic/createEmptyReportCell';
import { ReportBucket } from '../models/ReportBucket';
import { ReportCell } from '../models/ReportCell';
import { ReportCells } from '../models/ReportCells';
import { ReportMonthDocument } from '../models/ReportMonthDocument';
import { ReportReadBucket } from '../models/ReportReadBucket';
import { ReportViewDefinition } from '../models/ReportViewDefinition';
import { ReportCollapsedCells } from '../types/ReportCollapsedCells';
import { ReportPeriodAnswer } from '../types/ReportPeriodAnswer';
import { ReportSpan } from '../types/ReportSpan';
import { collapseReportCells } from './collapseReportCells';
import { fillReportBucketKeys } from './fillReportBucketKeys';
import { mergeReportCell } from './mergeReportCell';
import { mergeReportSeries } from './mergeReportSeries';
import { readReportOwnCell } from './readReportOwnCell';
import { reportReadBucketKey } from './reportReadBucketKey';
import { reportSpanDays } from './reportSpanDays';
import { reportSpanHours } from './reportSpanHours';

type AnswerView = Pick<ReportViewDefinition, 'bucket' | 'filter' | 'groupBy'>;
type Counted = { bucketKey: string; collapsed: ReportCollapsedCells };

// An hour or a day's cells across the documents read; a key belongs to one month, but merging costs nothing.
const cellsAt = (states: ReportMonthDocument[], key: string, hourly: boolean): ReportCells =>
  states.reduce<ReportCells>((cells, state) => mergeReportSeries(cells, (hourly ? state.hourly : state.daily)[key] ?? {}), {});

const totalOf = (counted: Counted[]): ReportCell =>
  counted.reduce((total, { collapsed }) => mergeReportCell(total, collapsed.total), createEmptyReportCell());

const seriesOf = (counted: Counted[]): Record<string, ReportCell> =>
  counted.reduce<Record<string, ReportCell>>((series, { collapsed }) => mergeReportSeries(series, collapsed.series), {});

// Every series value of the span in every bucket, zero where the bucket had none, so the lines line up.
const fillSeries = (series: Record<string, ReportCell>, values: string[]): Record<string, ReportCell> =>
  Object.fromEntries(values.map((value) => [value, readReportOwnCell(series, value) ?? createEmptyReportCell()]));

// An hour keeps its own key in an hourly view; a day or an hour goes to its day's bucket otherwise.
const bucketKeyOf = (key: string, bucket: AnswerView['bucket']): string =>
  bucket === undefined || bucket === ReportBucket.Hour ? key : reportReadBucketKey(key.slice(0, 10), bucket);

const toBucket = (key: string, counted: Counted[], seriesValues: string[], grouped: boolean): ReportReadBucket => {
  const members = counted.filter((entry) => entry.bucketKey === key);

  return { key, ...totalOf(members), ...(grouped ? { series: fillSeries(seriesOf(members), seriesValues) } : {}) };
};

/**
 * A view counted over one span of local days: the hourly cells for an hourly view or a comparison cut at an hour, the
 * daily cells otherwise, each collapsed by the view's filter and groupBy, then cut into the view's buckets (every bucket
 * of the span, empty ones at 0) and added up over the whole span.
 */
export const buildReportPeriodAnswer = (states: ReportMonthDocument[], span: ReportSpan, view: AnswerView): ReportPeriodAnswer => {
  const hourly = view.bucket === ReportBucket.Hour || span.lastHour !== null;
  const counted: Counted[] = (hourly ? reportSpanHours(span) : reportSpanDays(span)).map((key) => ({
    bucketKey: bucketKeyOf(key, view.bucket),
    collapsed: collapseReportCells(cellsAt(states, key, hourly), view),
  }));
  const series = seriesOf(counted);
  const seriesValues = Object.keys(series).sort();

  return {
    ...(view.bucket
      ? { buckets: fillReportBucketKeys(span, view.bucket).map((key) => toBucket(key, counted, seriesValues, view.groupBy !== undefined)) }
      : {}),
    total: totalOf(counted),
    series,
    truncated: states.some((state) => state.namesCapped) || counted.some(({ collapsed }) => collapsed.hasOther),
  };
};
