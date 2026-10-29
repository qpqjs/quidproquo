import { Effect } from '@qpqjs/core';
import { captureRequester } from '@qpqjs/testing';

import { describe, expect, it } from 'vitest';

import { askApplyTransientEventDocEvent, askApplyTransientEventDocEventBase } from './askApplyTransientEventDocEvent';
import { EventDocActionType } from './EventDocActionType';

type HoverEffect = Effect<'HOVER', { x: number }>;

describe('askApplyTransientEventDocEvent', () => {
  it('yields an ApplyTransientEvent action carrying the transient key, event type and data', () => {
    const { action } = captureRequester(askApplyTransientEventDocEvent<HoverEffect>('cursor', 'HOVER', { x: 1 }));

    expect(action).toEqual({
      type: EventDocActionType.ApplyTransientEvent,
      payload: { transientKey: 'cursor', eventType: 'HOVER', data: { x: 1 } },
    });
  });

  it('is the typed face of the base requester', () => {
    const { action } = captureRequester(askApplyTransientEventDocEventBase('cursor', 'HOVER', { x: 1 }));

    expect(action.payload).toEqual({ transientKey: 'cursor', eventType: 'HOVER', data: { x: 1 } });
  });
});
