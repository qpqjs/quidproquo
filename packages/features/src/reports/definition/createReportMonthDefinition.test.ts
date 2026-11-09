import { describe, expect, it } from 'vitest';

import { EventDocEffect, EventDocEvent } from '../../eventDoc/models';
import { ReportMonthEffect } from '../fold/effects/ReportMonthEffect';
import { reportBucketKeys } from '../logic/reportBucketKeys';
import { ReportMonthAppendEventsData } from '../models/ReportMonthAppendEventsData';
import { ReportMonthDocument } from '../models/ReportMonthDocument';
import { createReportMonthDefinition } from './createReportMonthDefinition';

const logEvent = (type: string, data: unknown, eventId: number, clientMessageId = `server-${eventId}`): EventDocEvent => ({
  type,
  payload: {
    data,
    metadata: {
      version: 1,
      clientMessageId,
      createdBy: { userId: 'system', userDisplayName: 'System' },
      createdAt: '2026-11-09T00:00:00.000Z',
      eventId,
    },
  },
});

const batch = (ats: string[]): ReportMonthAppendEventsData => ({
  limits: { maxCellsPerBucket: 200, maxDimensionNames: 32, maxMeasureNames: 32 },
  events: ats.map((at) => ({
    type: 'documentRendered',
    at: at as never,
    utcOffset: '+10:00',
    bucketKeys: reportBucketKeys(at as never, 600),
    dimensions: { outcome: 'ok' },
    measures: { pages: 2 },
  })),
});

const log: EventDocEvent[] = [
  logEvent(EventDocEffect.InitState, { id: 'month-1', code: 'documentRendered/2026-11', name: 'documentRendered/2026-11' }, 0),
  logEvent(ReportMonthEffect.AppendEvents, batch(['2026-11-08T00:10:00.000Z', '2026-11-08T01:10:00.000Z']), 1, 'm1'),
  logEvent(ReportMonthEffect.AppendEvents, batch(['2026-11-08T02:10:00.000Z']), 2, 'm2'),
];

describe('createReportMonthDefinition', () => {
  it('folds a month log into its cells', () => {
    const state = createReportMonthDefinition().foldDocumentState(log) as ReportMonthDocument;

    expect(state.code).toBe('documentRendered/2026-11');
    expect(state.daily['2026-11-08']!['outcome=ok']).toEqual({ count: 3, sums: { pages: 6 }, mins: { pages: 2 }, maxes: { pages: 2 } });
  });

  it('counts a redelivered queue message once: the fold refuses a repeated clientMessageId', () => {
    const redelivered = [...log, logEvent(ReportMonthEffect.AppendEvents, batch(['2026-11-08T00:10:00.000Z', '2026-11-08T01:10:00.000Z']), 3, 'm1')];
    const state = createReportMonthDefinition().foldDocumentState(redelivered) as ReportMonthDocument;

    expect(state.daily['2026-11-08']!['outcome=ok']!.count).toBe(3);
    expect(state.recentClientMessageIds).toContain('m1');
  });

  it('resumes from a snapshot to the same state as a fold from scratch', () => {
    const definition = createReportMonthDefinition();
    const snapshot = definition.foldSnapshotViews(log.slice(0, 2));

    expect(definition.foldDocumentState(log.slice(2), snapshot!.document)).toEqual(definition.foldDocumentState(log));
  });

  it('lets only server code append events, and carries no identity so every report can register it', () => {
    const definition = createReportMonthDefinition();

    expect(definition.getServerEventTypes()).toEqual([ReportMonthEffect.AppendEvents]);
    expect(definition.storeName).toBeUndefined();
    expect(definition.type).toBeUndefined();
  });
});
