import { QpqIsoDateTime } from 'quidproquo-core';

import { describe, expect, it } from 'vitest';

import { EventDocEvent } from '../../../eventDoc/models/EventDocEvent';
import { EventDocStatus } from '../../../eventDoc/models/EventDocStatus';
import { toMaintenancePublicState } from './logic/toMaintenancePublicState';
import { MaintenanceEffect } from './v1/events/effects/MaintenanceEffect';
import { MaintenanceUpdateData } from './v1/events/effects/MaintenanceUpdateData';
import { MaintenanceLevel } from './v1/types/MaintenanceLevel';
import { MaintenanceType } from './v1/types/MaintenanceType';
import { isMaintenancePubliclyVisible } from './isMaintenancePubliclyVisible';
import { maintenanceEventDoc } from './maintenanceEventDoc';

const eventId = (n: number): number => n;

const buildEvent = (type: string, data: unknown, createdAt: string, index: number): EventDocEvent => ({
  type,
  payload: {
    data,
    metadata: {
      version: 1,
      clientMessageId: `m${index}`,
      createdBy: { userId: 'u1', userDisplayName: 'Joe' },
      createdAt: createdAt as QpqIsoDateTime,
      eventId: eventId(index),
    },
  },
});

const T0 = '2026-07-24T10:00:00.000Z';
const T1 = '2026-07-24T10:05:00.000Z';
const T2 = '2026-07-24T10:10:00.000Z';

const update = (overrides: Partial<MaintenanceUpdateData> & { updateId: string }): MaintenanceUpdateData => ({
  bannerText: '',
  reason: 'Investigating',
  level: MaintenanceLevel.Low,
  maintenanceType: MaintenanceType.Incident,
  affectedServices: null,
  internalNotes: '',
  ...overrides,
});

const init = buildEvent('INIT_STATE', { id: 'doc1', code: 'incident', name: 'Investigating' }, T0, 0);

describe('maintenanceEventDoc', () => {
  it('derives the current state from the last update; the eta clock carries over from the last announcement', () => {
    const state = maintenanceEventDoc.views.document.fold([
      init,
      buildEvent(
        MaintenanceEffect.AddUpdate,
        update({ updateId: 'up1', reason: 'Investigating db issue', level: MaintenanceLevel.High, etaDurationMins: 30, internalNotes: 'locks' }),
        T0,
        1,
      ),
      // No eta on this one — the 30min clock anchored at T0 must carry over.
      buildEvent(
        MaintenanceEffect.AddUpdate,
        update({ updateId: 'up2', reason: 'Fix deploying', level: MaintenanceLevel.Low, affectedServices: ['template'] }),
        T1,
        2,
      ),
    ]);

    expect(state.reason).toBe('Fix deploying');
    // No explicit banner text — the banner falls back to the newest reason.
    expect(state.bannerText).toBe('Fix deploying');
    expect(state.level).toBe(MaintenanceLevel.Low);
    expect(state.affectedServices).toEqual(['template']);
    expect(state.etaDurationMins).toBe(30);
    expect(state.etaEndsAt).toBe('2026-07-24T10:30:00.000Z');
    expect(state.status).toBe(EventDocStatus.Draft);
    expect(state.updates).toHaveLength(2);
  });

  it('an update announcing a new eta re-anchors the clock; null clears it; deleting the newest rolls back', () => {
    const log = [
      init,
      buildEvent(MaintenanceEffect.AddUpdate, update({ updateId: 'up1', reason: 'Investigating', etaDurationMins: 120 }), T0, 1),
      buildEvent(MaintenanceEffect.AddUpdate, update({ updateId: 'up2', reason: 'Nearly done', etaDurationMins: 10 }), T2, 2),
    ];

    // 10 mins from T2, not 120 from T0.
    expect(maintenanceEventDoc.views.document.fold(log).etaEndsAt).toBe('2026-07-24T10:20:00.000Z');

    // Deleting the newest update rolls both the status line and the clock back.
    const rolledBack = maintenanceEventDoc.views.document.fold([...log, buildEvent(MaintenanceEffect.RemoveUpdate, { updateId: 'up2' }, T2, 3)]);
    expect(rolledBack.reason).toBe('Investigating');
    expect(rolledBack.etaEndsAt).toBe('2026-07-24T12:00:00.000Z');

    // null explicitly clears to unknown.
    const cleared = maintenanceEventDoc.views.document.fold([
      ...log,
      buildEvent(MaintenanceEffect.AddUpdate, update({ updateId: 'up3', reason: 'Unsure now', etaDurationMins: null }), T2, 3),
    ]);
    expect(cleared.etaDurationMins).toBeNull();
    expect(cleared.etaEndsAt).toBeNull();
  });

  it('editing re-anchors the eta only when the edit announces one, and re-derives the current state', () => {
    const log = [init, buildEvent(MaintenanceEffect.AddUpdate, update({ updateId: 'up1', reason: 'Investigating', etaDurationMins: 30 }), T0, 1)];

    // Edit WITHOUT an eta: text changes, the T0-anchored clock stays.
    const textEdit = maintenanceEventDoc.views.document.fold([
      ...log,
      buildEvent(MaintenanceEffect.EditUpdate, update({ updateId: 'up1', reason: 'Investigating hard' }), T1, 2),
    ]);
    expect(textEdit.reason).toBe('Investigating hard');
    expect(textEdit.etaEndsAt).toBe('2026-07-24T10:30:00.000Z');
    expect(textEdit.updates[0].updatedAt).toBe(T1);

    // Edit WITH an eta: fresh announcement anchored to the edit's own time.
    const etaEdit = maintenanceEventDoc.views.document.fold([
      ...log,
      buildEvent(MaintenanceEffect.EditUpdate, update({ updateId: 'up1', reason: 'Investigating', etaDurationMins: 30 }), T2, 2),
    ]);
    expect(etaEdit.etaEndsAt).toBe('2026-07-24T10:40:00.000Z');
  });

  it('an explicit banner text wins over the update reason', () => {
    const state = maintenanceEventDoc.views.document.fold([
      init,
      buildEvent(
        MaintenanceEffect.AddUpdate,
        update({ updateId: 'up1', bannerText: 'Scheduled update in progress', reason: 'Rolling out template service' }),
        T1,
        1,
      ),
    ]);

    expect(state.bannerText).toBe('Scheduled update in progress');
    expect(state.reason).toBe('Rolling out template service');
    expect(toMaintenancePublicState(state).bannerText).toBe('Scheduled update in progress');
  });

  it('is publicly visible only as an open draft with updates at a non-Internal level', () => {
    // A fresh doc with no updates has announced nothing.
    expect(isMaintenancePubliclyVisible(maintenanceEventDoc.views.document.fold([init]))).toBe(false);

    const internal = [
      init,
      buildEvent(MaintenanceEffect.AddUpdate, update({ updateId: 'up1', reason: 'Poking around', level: MaintenanceLevel.Internal }), T1, 1),
    ];
    expect(isMaintenancePubliclyVisible(maintenanceEventDoc.views.document.fold(internal))).toBe(false);

    // Promoted to Low → visible.
    const promoted = [
      ...internal,
      buildEvent(MaintenanceEffect.AddUpdate, update({ updateId: 'up2', reason: 'Found it', level: MaintenanceLevel.Low }), T2, 2),
    ];
    expect(isMaintenancePubliclyVisible(maintenanceEventDoc.views.document.fold(promoted))).toBe(true);

    // Closed → invisible again, whatever the level was.
    const closed = [...promoted, buildEvent('PUBLISH', { effectiveFrom: T2 }, T2, 3)];
    expect(isMaintenancePubliclyVisible(maintenanceEventDoc.views.document.fold(closed))).toBe(false);
  });

  it('strips internal notes and authors from the public projection; the public update text is the reason', () => {
    const state = maintenanceEventDoc.views.document.fold([
      init,
      buildEvent(MaintenanceEffect.AddUpdate, update({ updateId: 'up1', reason: 'Working on it', internalNotes: 'SECRET' }), T1, 1),
    ]);

    const publicState = toMaintenancePublicState(state);

    expect(publicState.updates).toEqual([{ id: 'up1', displayText: 'Working on it', createdAt: T1 }]);
    expect(JSON.stringify(publicState)).not.toContain('SECRET');
    expect(JSON.stringify(publicState)).not.toContain('Joe');
    expect(publicState.reason).toBe('Working on it');
  });
});
