import { askReduceState } from '@qpqjs/core';
import { runStory } from '@qpqjs/testing';
import { ApiActionType } from '@qpqjs/webserver';

import { describe, expect, it } from 'vitest';

import { eventDocListReducer } from '../eventDocListReducer';
import { EventDocListState } from '../types/EventDocListState';
import { askEventDocListLoad } from './askEventDocListLoad';
import { createInitialEventDocListState } from './createInitialEventDocListState';

type RequestPayload = { service: string; endpoint: string; params?: Record<string, string> };

const load = (listView: string) => {
  const requests: RequestPayload[] = [];
  const initial: EventDocListState = { ...createInitialEventDocListState(), listView, pageSize: 20 };

  const state = runStory(
    askReduceState(initial, eventDocListReducer, () => askEventDocListLoad('sign', '/envelopes')),
    {
      [ApiActionType.Request]: (action: { payload: RequestPayload }) => {
        requests.push(action.payload);
        return { status: 200, data: { items: [{ id: 'doc-1', envelopeStatus: 'sent' }], nextPageKey: 'next' } };
      },
    },
  );

  return { requests, state };
};

describe('askEventDocListLoad', () => {
  it('asks for the list view the config names and keeps its rows and the next cursor', () => {
    const { requests, state } = load('overview');

    expect(requests[0]).toMatchObject({ service: 'sign', endpoint: '/v1/envelopes', params: { limit: '20', view: 'overview' } });
    expect(state.items).toEqual([{ id: 'doc-1', envelopeStatus: 'sent' }]);
    expect(state.nextPageKey).toBe('next');
  });

  it('names no view for a list of summaries', () => {
    expect(load('').requests[0]?.params).toEqual({ limit: '20' });
  });
});
