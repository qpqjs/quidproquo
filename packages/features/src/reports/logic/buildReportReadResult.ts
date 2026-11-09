import { QpqIsoDateTime, UtcOffset } from '@qpqjs/core';

import { ReportComparisonResult } from '../models/ReportComparisonResult';
import { ReportMonthDocument } from '../models/ReportMonthDocument';
import { ReportReadResult } from '../models/ReportReadResult';
import { ReportViewDefinition } from '../models/ReportViewDefinition';
import { ReportReadPlan } from '../types/ReportReadPlan';
import { alignReportComparisonGroups } from './alignReportComparisonGroups';
import { buildReportPeriodAnswer } from './buildReportPeriodAnswer';
import { RankedReportGroups, rankReportGroups } from './rankReportGroups';
import { reportComparisonUntil } from './reportComparisonUntil';

/** Everything a read's answer is built from: the view, the clock and offset it was read at, its plan, and the month documents read. */
export type ReportReadResultInput = {
  view: ReportViewDefinition;
  now: QpqIsoDateTime;
  utcOffset: UtcOffset;
  utcOffsetMinutes: number;
  plan: ReportReadPlan;
  // By local month (`YYYY-MM`); a month with no document is absent.
  states: ReadonlyMap<string, ReportMonthDocument>;
};

const statesFor = (states: ReadonlyMap<string, ReportMonthDocument>, months: string[]): ReportMonthDocument[] =>
  months.flatMap((month) => states.get(month) ?? []);

const sortedUnion = (lists: string[][]): string[] => [...new Set(lists.flat())].sort();

const buildComparison = (input: ReportReadResultInput, grouped: RankedReportGroups | undefined): ReportComparisonResult | undefined => {
  const { view, plan, utcOffset, utcOffsetMinutes } = input;

  if (plan.comparison === null || view.compare === undefined) {
    return undefined;
  }

  const { span, months, beyondRetention } = plan.comparison;
  const { buckets, total, series } = buildReportPeriodAnswer(statesFor(input.states, months), span, view);

  return {
    compare: view.compare,
    period: {
      ...view.period,
      utcOffset,
      from: span.from,
      to: span.to,
      ...(span.lastHour !== null ? { until: reportComparisonUntil(span.to, span.lastHour, utcOffsetMinutes) } : {}),
      ...(beyondRetention ? { beyondRetention } : {}),
    },
    total: total.count,
    sums: total.sums,
    mins: total.mins,
    maxes: total.maxes,
    ...(buckets ? { buckets } : {}),
    ...(grouped ? { groups: alignReportComparisonGroups(grouped.groups, series) } : {}),
  };
};

/**
 * A view's answer from the month documents its plan read, in the register query's shape: the resolved period, buckets
 * when the view cuts time, the totals, ranked groups when it groups, and the comparison when it names one. Pure.
 */
export const buildReportReadResult = (input: ReportReadResultInput): ReportReadResult => {
  const { view, now, plan, utcOffset } = input;
  const periodStates = statesFor(input.states, plan.periodMonths);
  const answer = buildReportPeriodAnswer(periodStates, plan.period, view);
  const grouped = view.groupBy !== undefined ? rankReportGroups(answer.series, view.measure, view.groupLimit) : undefined;
  const comparison = buildComparison(input, grouped);

  return {
    now,
    period: { ...view.period, utcOffset, from: plan.period.from, to: plan.period.to },
    ...(view.bucket && answer.buckets ? { bucket: view.bucket, buckets: answer.buckets } : {}),
    total: answer.total.count,
    sums: answer.total.sums,
    mins: answer.total.mins,
    maxes: answer.total.maxes,
    ...(grouped ? grouped : {}),
    ...(comparison ? { comparison } : {}),
    truncated: answer.truncated,
    dimensionKeys: sortedUnion(periodStates.map((state) => state.dimensionKeys)),
    measureKeys: sortedUnion(periodStates.map((state) => state.measureKeys)),
  };
};
